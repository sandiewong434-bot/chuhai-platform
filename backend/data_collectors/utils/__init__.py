# -*- coding: utf-8 -*-
"""
公共采集工具
============
- HTTP 请求增强 (带重试、UA轮换、session预热、反爬头)
- HTML 解析辅助
- 企业名归一化
- 日期解析
"""

from __future__ import annotations

import json
import random
import re
import time
from datetime import datetime
from typing import Any

import httpx
from bs4 import BeautifulSoup


# ========== HTTP ==========

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
]

DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": '"Not(A:Brand";v="99", "Google Chrome";v="128", "Chromium";v="128"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "DNT": "1",
}

# 常见站点的 Referer 映射
SITE_REFERERS = {
    "stats.gov.cn": "https://data.stats.gov.cn/",
    "smm.cn": "https://www.smm.cn/",
    "100ppi.com": "https://www.100ppi.com/",
    "cbea.com": "https://www.cbea.com/",
}


def _build_headers(url: str, extra: dict | None = None) -> dict:
    """构建带反爬特征的请求头，自动推断 Referer"""
    ua = random.choice(USER_AGENTS)
    h = {
        "User-Agent": ua,
        **DEFAULT_HEADERS,
    }
    # 自动推断 Referer
    for domain, referer in SITE_REFERERS.items():
        if domain in url:
            h["Referer"] = referer
            h["Sec-Fetch-Site"] = "same-origin" if referer in url else "cross-site"
            break
    if extra:
        h.update(extra)
    return h


def _warmup_session(client: httpx.Client, url: str) -> None:
    """Session 预热：模拟真实浏览路径获取 cookie"""
    parsed = httpx.URL(url)
    origin = f"{parsed.scheme}://{parsed.host}/"
    domain = parsed.host

    # 步骤1: 访问首页
    try:
        client.get(origin, headers=_build_headers(origin), timeout=10)
    except Exception:
        pass

    # 步骤2: 针对国家统计局，访问数据查询页面
    if "stats.gov.cn" in domain:
        try:
            client.get(
                "https://data.stats.gov.cn/easyquery.htm?cn=A01",
                headers=_build_headers("https://data.stats.gov.cn/easyquery.htm?cn=A01"),
                timeout=10,
            )
        except Exception:
            pass
        try:
            client.get(
                "https://data.stats.gov.cn/easyquery.htm?cn=C01",
                headers=_build_headers("https://data.stats.gov.cn/easyquery.htm?cn=C01"),
                timeout=10,
            )
        except Exception:
            pass


def http_get(url: str, headers: dict | None = None, timeout: int = 30, max_retries: int = 3, use_session: bool = False, **kwargs) -> httpx.Response:
    """带重试的 GET 请求，增强反爬能力
    
    use_session=True: 先预热同源首页获取 cookie，再发实际请求（解决 stats.gov.cn 等强反爬站点）
    """
    h = _build_headers(url, headers)
    last_err = None
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                if use_session:
                    _warmup_session(client, url)
                resp = client.get(url, headers=h, **kwargs)
            # 对于 403/503/429，尝试换 UA 重试
            if resp.status_code in (403, 503, 429) and attempt < max_retries - 1:
                h["User-Agent"] = random.choice(USER_AGENTS)
                wait = 2 ** attempt + random.uniform(1, 3)
                print(f"[WARN] GET 收到 {resp.status_code}，换 UA 后 {wait:.1f}s 重试 ({attempt+1}/{max_retries})")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except Exception as e:
            last_err = e
            wait = 2 ** attempt + random.uniform(0, 2)
            print(f"[WARN] GET 失败 ({attempt+1}/{max_retries}): {e}, {wait:.1f}s 后重试")
            time.sleep(wait)
    raise Exception(f"请求失败: {url} | 最后错误: {last_err}")


def http_post(url: str, data: dict | None = None, json_data: dict | None = None, headers: dict | None = None, timeout: int = 30, max_retries: int = 3, use_session: bool = False) -> httpx.Response:
    """带重试的 POST 请求，增强反爬能力
    
    use_session=True: 先预热同源首页获取 cookie，再发实际请求
    """
    h = _build_headers(url, headers)
    # POST 请求需要调整 Sec-Fetch 头
    h["Sec-Fetch-Dest"] = "empty"
    h["Sec-Fetch-Mode"] = "cors"
    h["Sec-Fetch-Site"] = "same-origin"
    # 针对 AJAX 请求添加 X-Requested-With
    h["X-Requested-With"] = "XMLHttpRequest"
    last_err = None
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                if use_session:
                    _warmup_session(client, url)
                if json_data:
                    h.setdefault("Content-Type", "application/json")
                    resp = client.post(url, headers=h, json=json_data)
                else:
                    resp = client.post(url, headers=h, data=data)
            # 对于 403/503/429，换 UA 重试
            if resp.status_code in (403, 503, 429) and attempt < max_retries - 1:
                h["User-Agent"] = random.choice(USER_AGENTS)
                wait = 2 ** attempt + random.uniform(1, 3)
                print(f"[WARN] POST 收到 {resp.status_code}，换 UA 后 {wait:.1}s 重试 ({attempt+1}/{max_retries})")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp
        except Exception as e:
            last_err = e
            wait = 2 ** attempt + random.uniform(0, 2)
            print(f"[WARN] POST 失败 ({attempt+1}/{max_retries}): {e}, {wait:.1f}s 后重试")
            time.sleep(wait)
    raise Exception(f"POST 失败: {url} | 最后错误: {last_err}")


# ========== HTML / JSON 解析 ==========

def parse_html(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


def extract_json_from_html(html: str, var_name: str | None = None) -> list[dict] | dict | None:
    """
    从 HTML 中提取 JSON 数据
    var_name: 如果指定，寻找 window.xxx = {...} 或 var xxx = {...}
    """
    if var_name:
        # 尝试 window.var_name = {...}
        pattern = rf"window\.{re.escape(var_name)}\s*=\s*(\{{.*?\}});"
        m = re.search(pattern, html, re.DOTALL)
        if not m:
            pattern = rf"var\s+{re.escape(var_name)}\s*=\s*(\{{.*?\}});"
            m = re.search(pattern, html, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                pass
    # 尝试 <script type="application/json">...</script>
    scripts = re.findall(r'<script[^>]*type=["\']application/json["\'][^>]*>(.*?)</script>', html, re.DOTALL)
    for s in scripts:
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            continue
    return None


# ========== 企业名归一化 ==========

ENTERPRISE_ALIASES = {
    "比亚迪": ["BYD", "比亚迪汽车", "比亚迪股份"],
    "宁德时代": ["CATL", "宁王", "宁德时代新能源"],
    "特斯拉": ["Tesla", "TSLA"],
    "蔚来": ["NIO", "Nio"],
    "小鹏": ["XPeng", "XPEV", "小鹏汽车"],
    "理想": ["Li Auto", "LI", "理想汽车"],
    "极氪": ["ZEEKR", "Zeekr"],
    "埃安": ["AION", "GAC Aion"],
    "上汽": ["SAIC", "上汽集团"],
    "一汽": ["FAW", "中国第一汽车集团"],
    "广汽": ["GAC", "广州汽车集团"],
    "东风": ["DFM", "东风汽车"],
    "长安": ["Changan", "长安汽车"],
    "吉利": ["Geely", "吉利汽车"],
    "长城": ["GWM", "Great Wall", "长城汽车"],
    "奇瑞": ["Chery", "奇瑞汽车"],
    "华为": ["HUAWEI", "华为技术"],
    "中创新航": ["CALB", "中航锂电"],
    "亿纬锂能": ["EVE", "EVE Energy"],
    "国轩高科": ["Gotion", "国轩"],
    "欣旺达": ["Sunwoda"],
    "蜂巢能源": ["SVOLT", "蜂巢"],
    "孚能科技": ["Farasis"],
}


def normalize_enterprise(name: str) -> str:
    """企业名归一化"""
    if not name:
        return ""
    name = name.strip()
    # 直接匹配
    for canonical, aliases in ENTERPRISE_ALIASES.items():
        if name == canonical or name in aliases:
            return canonical
    # 模糊包含
    for canonical, aliases in ENTERPRISE_ALIASES.items():
        if canonical in name:
            return canonical
        for a in aliases:
            if a in name:
                return canonical
    return name


# ========== 日期解析 ==========

def parse_date(date_str: str) -> datetime | None:
    """多格式日期解析"""
    if not date_str:
        return None
    date_str = str(date_str).strip()
    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%Y年%m月%d日",
        "%Y%m%d",
        "%Y-%m",
        "%Y/%m",
        "%Y年%m月",
        "%Y",
        "%Y-%m-%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


def month_end(year: int, month: int) -> datetime:
    """获取某月末日期"""
    if month == 12:
        return datetime(year + 1, 1, 1) - __import__('datetime').timedelta(days=1)
    return datetime(year, month + 1, 1) - __import__('datetime').timedelta(days=1)


# ========== 国家/地区归一化 ==========

COUNTRY_ALIASES = {
    "中国": ["CN", "CHN", "People's Republic of China", "Mainland China"],
    "美国": ["US", "USA", "United States", "America", "United States of America"],
    "德国": ["DE", "DEU", "Germany"],
    "日本": ["JP", "JPN", "Japan"],
    "韩国": ["KR", "KOR", "South Korea", "Republic of Korea"],
    "泰国": ["TH", "THA", "Thailand"],
    "印尼": ["ID", "IDN", "Indonesia"],
    "印度": ["IN", "IND", "India"],
    "巴西": ["BR", "BRA", "Brazil"],
    "墨西哥": ["MX", "MEX", "Mexico"],
    "英国": ["GB", "GBR", "UK", "United Kingdom"],
    "法国": ["FR", "FRA", "France"],
    "意大利": ["IT", "ITA", "Italy"],
    "西班牙": ["ES", "ESP", "Spain"],
    "匈牙利": ["HU", "HUN", "Hungary"],
    "土耳其": ["TR", "TUR", "Turkey"],
    "俄罗斯": ["RU", "RUS", "Russia"],
    "澳大利亚": ["AU", "AUS", "Australia"],
    "加拿大": ["CA", "CAN", "Canada"],
    "越南": ["VN", "VNM", "Vietnam"],
    "马来西亚": ["MY", "MYS", "Malaysia"],
    "菲律宾": ["PH", "PHL", "Philippines"],
    "波兰": ["PL", "POL", "Poland"],
    "瑞典": ["SE", "SWE", "Sweden"],
    "挪威": ["NO", "NOR", "Norway"],
    "荷兰": ["NL", "NLD", "Netherlands"],
    "比利时": ["BE", "BEL", "Belgium"],
    "瑞士": ["CH", "CHE", "Switzerland"],
    "奥地利": ["AT", "AUT", "Austria"],
    "葡萄牙": ["PT", "PRT", "Portugal"],
    "捷克": ["CZ", "CZE", "Czech Republic"],
    "斯洛伐克": ["SK", "SVK", "Slovakia"],
    "罗马尼亚": ["RO", "ROU", "Romania"],
    "塞尔维亚": ["RS", "SRB", "Serbia"],
    "摩洛哥": ["MA", "MAR", "Morocco"],
    "南非": ["ZA", "ZAF", "South Africa"],
    "以色列": ["IL", "ISR", "Israel"],
    "阿联酋": ["AE", "ARE", "UAE", "United Arab Emirates"],
    "沙特阿拉伯": ["SA", "SAU", "Saudi Arabia"],
    "埃及": ["EG", "EGY", "Egypt"],
    "阿根廷": ["AR", "ARG", "Argentina"],
    "智利": ["CL", "CHL", "Chile"],
    "哥伦比亚": ["CO", "COL", "Colombia"],
    "秘鲁": ["PE", "PER", "Peru"],
    "新西兰": ["NZ", "NZL", "New Zealand"],
    "新加坡": ["SG", "SGP", "Singapore"],
}


def normalize_country(name: str) -> str:
    """国家名归一化"""
    if not name:
        return ""
    name = name.strip()
    for canonical, aliases in COUNTRY_ALIASES.items():
        if name == canonical or name in aliases:
            return canonical
        if canonical in name:
            return canonical
        for a in aliases:
            if a.lower() in name.lower():
                return canonical
    return name
