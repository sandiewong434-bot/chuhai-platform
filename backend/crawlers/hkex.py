#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
港交所披露易爬虫
URL: https://www.hkexnews.hk

特点：
- 港股上市公司公告（含蔚来、小鹏、理想等NEV企业）
- 提供中英文公告
- 支持按公司和日期筛选

采集字段：
- 公告标题、发布时间、公司代码、公司简称
- 公告类型、PDF下载链接
"""

import hashlib
import json
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models import Article

# ============================================================
# 配置
# ============================================================

SOURCE_ID = 2
SOURCE_NAME = "港交所披露易"
BASE_URL = "https://www.hkexnews.hk"

# NEV相关港股公司代码
TARGET_COMPANIES_HK = [
    "9866",   # 蔚来-SW
    "9868",   # 小鹏汽车-SW
    "2015",   # 理想汽车-W
    "1211",   # 比亚迪股份
    "175",    # 吉利汽车
    "2333",   # 长城汽车
    "2238",   # 广汽集团
]

RELEVANT_KEYWORDS = [
    "海外", "境外", "出口", "出海",
    "投资", "建厂", "工厂", "基地",
    "合资", "合作", "协议", "签约",
    "反倾销", "反补贴", "关税", "贸易",
    "销量", "销售", "市场", "订单",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


# ============================================================
# API 请求
# ============================================================

def fetch_today_announcements(page: int = 1) -> dict[str, Any]:
    """
    获取今日公告列表
    
    港交所披露易的API端点：
    /search/titlesearch.xhtml?lang=zh
    """
    url = f"{BASE_URL}/search/titlesearch.xhtml?lang=zh"
    
    # 获取今日日期
    today = datetime.now().strftime("%Y%m%d")
    
    # 港交所的搜索参数
    params = {
        "searchType": "1",  # 标题搜索
        "todaynews": "1",   # 今日公告
        "title": "",
        "stockId": "",
        "fromDate": today,
        "toDate": today,
        "pageNo": str(page),
    }
    
    try:
        with httpx.Client(timeout=30, headers=HEADERS, follow_redirects=True) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            # 港交所返回的是HTML页面，需要解析
            return {"html": resp.text, "source": "hkex_html"}
    except Exception as e:
        print(f"[ERROR] 港交所请求失败: {e}")
        return {"html": "", "source": "hkex_html"}


def fetch_by_stock(stock_code: str, page: int = 1, days_back: int = 7) -> dict[str, Any]:
    """
    按股票代码获取公告
    
    使用港交所的搜索功能
    """
    end_date = datetime.now().strftime("%Y%m%d")
    start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y%m%d")
    
    url = f"{BASE_URL}/search/titlesearch.xhtml?lang=zh"
    
    params = {
        "searchType": "1",
        "title": "",
        "stockId": stock_code,
        "fromDate": start_date,
        "toDate": end_date,
        "pageNo": str(page),
    }
    
    try:
        with httpx.Client(timeout=30, headers=HEADERS, follow_redirects=True) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            return {"html": resp.text, "stock_code": stock_code, "source": "hkex_html"}
    except Exception as e:
        print(f"[ERROR] 港交所请求失败 [{stock_code}]: {e}")
        return {"html": "", "stock_code": stock_code, "source": "hkex_html"}


# ============================================================
# HTML 解析（简化版）
# ============================================================

def parse_announcements_from_html(html: str) -> list[dict]:
    """
    从港交所HTML页面解析公告列表
    
    注意：这是一个简化实现。港交所页面结构复杂，
    完整实现需要更详细的HTML解析。
    """
    announcements = []
    
    # 港交所的公告列表通常在表格中
    # 这里提供一个基础框架，实际使用时需要根据页面结构完善
    try:
        # 使用正则提取公告信息（简化处理）
        import re
        
        # 提取标题链接模式
        title_pattern = r'<a[^>]*href="(/listedco/listconews/[^"]*)"[^>]*>(.*?)</a>'
        titles = re.findall(title_pattern, html, re.DOTALL)
        
        # 提取日期模式
        date_pattern = r'(\d{2}/\d{2}/\d{4})'
        dates = re.findall(date_pattern, html)
        
        # 提取股票代码
        stock_pattern = r'(\d{4,5})\.HK'
        stocks = re.findall(stock_pattern, html)
        
        # 组合数据（简化，实际需要更精确的解析）
        for i, (href, title) in enumerate(titles[:10]):
            title_clean = re.sub(r'<[^>]+>', '', title).strip()
            if not title_clean:
                continue
                
            pub_date = dates[i] if i < len(dates) else ""
            stock = stocks[i] if i < len(stocks) else ""
            
            announcements.append({
                "announcementId": f"hkex_{stock}_{i}",
                "announcementTitle": title_clean,
                "stockCode": stock,
                "announcementTime": pub_date,
                "adjunctUrl": href if href.startswith("http") else f"{BASE_URL}{href}",
            })
    
    except Exception as e:
        print(f"[ERROR] HTML解析失败: {e}")
    
    return announcements


# ============================================================
# 数据处理
# ============================================================

def is_relevant(title: str) -> bool:
    """判断公告是否与出海相关"""
    return any(kw in title for kw in RELEVANT_KEYWORDS)


def generate_unique_key(announcement: dict) -> str:
    """生成唯一标识"""
    key_str = f"hkex:{announcement.get('stockCode', '')}:{announcement.get('announcementTitle', '')}"
    return hashlib.md5(key_str.encode()).hexdigest()


def save_announcement(db: Session, announcement: dict) -> bool:
    """保存单条公告，返回True表示新插入"""
    unique_key = generate_unique_key(announcement)
    
    existing = db.query(Article).filter(Article.unique_key == unique_key).first()
    if existing:
        return False
    
    publish_time = announcement.get("announcementTime", "")
    try:
        if "/" in publish_time:
            # DD/MM/YYYY格式
            publish_date = datetime.strptime(publish_time, "%d/%m/%Y").date()
        else:
            publish_date = datetime.strptime(publish_time[:10], "%Y-%m-%d").date() if publish_time else None
    except ValueError:
        publish_date = None
    
    content = announcement.get("announcementTitle", "")
    adjunct_url = announcement.get("adjunctUrl", "")
    if adjunct_url:
        content += f"\n\n原文链接: {adjunct_url}"
    
    article = Article(
        source_id=SOURCE_ID,
        source_name=SOURCE_NAME,
        title=announcement.get("announcementTitle", "无标题"),
        url=adjunct_url or BASE_URL,
        publish_date=publish_date,
        unique_key=unique_key,
        content=content[:5000],
    )
    
    db.add(article)
    db.commit()
    return True


# ============================================================
# 主流程
# ============================================================

def crawl_hkex(
    days_back: int = 7,
    max_pages: int = 3,
    target_companies: list[str] | None = None,
) -> dict[str, Any]:
    """执行港交所爬虫"""
    if target_companies is None:
        target_companies = TARGET_COMPANIES_HK
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    
    stats = {
        "source": SOURCE_NAME,
        "start_date": start_date,
        "end_date": end_date,
        "total_fetched": 0,
        "new_inserted": 0,
        "skipped": 0,
        "errors": 0,
    }
    
    db = SessionLocal()
    try:
        for stock_code in target_companies:
            print(f"[INFO] 抓取港交所公司: {stock_code}")
            
            for page in range(1, max_pages + 1):
                try:
                    result = fetch_by_stock(stock_code, page, days_back)
                    html = result.get("html", "")
                    
                    if not html:
                        break
                    
                    announcements = parse_announcements_from_html(html)
                    if not announcements:
                        break
                    
                    for announcement in announcements:
                        stats["total_fetched"] += 1
                        title = announcement.get("announcementTitle", "")
                        
                        if not is_relevant(title):
                            stats["skipped"] += 1
                            continue
                        
                        try:
                            if save_announcement(db, announcement):
                                stats["new_inserted"] += 1
                                print(f"  [NEW] {title[:55]}...")
                            else:
                                stats["skipped"] += 1
                        except Exception as e:
                            stats["errors"] += 1
                            print(f"  [ERROR] 入库: {e}")
                    
                    time.sleep(2)
                    
                except Exception as e:
                    stats["errors"] += 1
                    print(f"[ERROR] 抓取失败: {e}")
                    break
            
            time.sleep(3)
    
    finally:
        db.close()
    
    return stats


def run_daily_update():
    """每日增量更新入口"""
    print("=" * 60)
    print(f"[START] 港交所爬虫 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    stats = crawl_hkex(days_back=1, max_pages=2)
    
    print("\n" + "=" * 60)
    print("[SUMMARY]")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print("=" * 60)
    return stats


# ============================================================
# CLI 入口
# ============================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="港交所披露易爬虫")
    parser.add_argument("--days", type=int, default=7, help="回溯天数")
    parser.add_argument("--pages", type=int, default=3, help="每公司最大页数")
    parser.add_argument("--company", type=str, default=None, help="指定公司代码")
    parser.add_argument("--daily", action="store_true", help="每日增量更新")
    
    args = parser.parse_args()
    
    if args.daily:
        run_daily_update()
    else:
        companies = [args.company] if args.company else None
        stats = crawl_hkex(
            days_back=args.days,
            max_pages=args.pages,
            target_companies=companies,
        )
        print(json.dumps(stats, ensure_ascii=False, indent=2))
