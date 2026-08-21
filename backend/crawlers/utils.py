# -*- coding: utf-8 -*-
"""爬虫工具函数"""

import hashlib
import random
import time
from datetime import datetime

import httpx


def safe_request(
    url: str,
    method: str = "GET",
    headers: dict | None = None,
    data: dict | None = None,
    json_data: dict | None = None,
    timeout: int = 30,
    max_retries: int = 3,
) -> httpx.Response:
    """
    带重试的 HTTP 请求
    
    自动处理：
    - User-Agent 轮换
    - 指数退避重试
    - 超时处理
    """
    user_agents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ]
    
    default_headers = {
        "User-Agent": random.choice(user_agents),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
    }
    
    if headers:
        default_headers.update(headers)
    
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                if method.upper() == "GET":
                    resp = client.get(url, headers=default_headers)
                elif method.upper() == "POST":
                    if json_data:
                        resp = client.post(url, headers=default_headers, json=json_data)
                    else:
                        resp = client.post(url, headers=default_headers, data=data)
                else:
                    raise ValueError(f"不支持的 HTTP 方法: {method}")
                
                resp.raise_for_status()
                return resp
                
        except Exception as e:
            wait_time = 2 ** attempt + random.uniform(0, 1)
            print(f"[WARN] 请求失败 ({attempt+1}/{max_retries}): {e}, {wait_time:.1f}s 后重试")
            time.sleep(wait_time)
    
    raise Exception(f"请求失败，已达最大重试次数: {url}")


def generate_id(*parts: str) -> str:
    """基于内容生成唯一 ID"""
    content = "|".join(parts)
    return hashlib.md5(content.encode("utf-8")).hexdigest()[:16]


def parse_chinese_date(date_str: str) -> datetime | None:
    """解析中文日期格式"""
    formats = [
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%Y年%m月%d日",
        "%Y%m%d",
        "%Y-%m-%d %H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    
    return None


def truncate_text(text: str, max_length: int = 5000) -> str:
    """截断文本到指定长度"""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "\n... [内容已截断]"


def clean_html(html: str) -> str:
    """简单 HTML 标签去除"""
    import re
    # 去除 script 和 style
    html = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[^>]*>[\s\S]*?</style>", "", html, flags=re.IGNORECASE)
    # 去除所有标签
    html = re.sub(r"<[^>]+>", "", html)
    # 去除多余空白
    html = re.sub(r"\s+", " ", html)
    return html.strip()
