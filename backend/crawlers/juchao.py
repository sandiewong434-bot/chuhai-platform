#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
巨潮资讯网爬虫
URL: http://www.cninfo.com.cn/new/information/topSearch/query

特点：
- 公告类型丰富（定期报告、临时公告、IPO等）
- 上市公司覆盖全面
- 提供 PDF 原文下载链接
- 反爬较弱，适合作为第一个接入的信源

采集字段：
- 公告标题、发布时间、公司代码、公司简称
- 公告类型、PDF 下载链接
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

SOURCE_ID = 1
SOURCE_NAME = "巨潮资讯网"
BASE_URL = "http://www.cninfo.com.cn"

RELEVANT_KEYWORDS = [
    "海外", "境外", "出国", "出口", "出海",
    "投资", "建厂", "工厂", "基地",
    "合资", "合作", "协议", "签约",
    "反倾销", "反补贴", "关税", "贸易",
    "销量", "销售", "市场", "订单",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "http://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
}


# ============================================================
# API 请求
# ============================================================

def fetch_announcement_list(
    page_num: int = 1,
    page_size: int = 30,
    column: str = "sse",
    plate: str = "sh",
    stock_code: str | None = None,
) -> dict[str, Any]:
    """获取公告列表"""
    url = f"{BASE_URL}/new/hisAnnouncement/query"
    
    payload = {
        "pageNum": page_num,
        "pageSize": page_size,
        "column": column,
        "tabName": "fulltext",
        "stock": stock_code or "",
        "searchkey": "",
        "secid": "",
        "plate": plate,
        "category": "category_all",
        "trade": "",
        "columnTitle": "历年公告",
        "pageNo": page_num,
    }
    
    if stock_code:
        payload["stock"] = stock_code
        if stock_code.startswith("6") or stock_code.startswith("5"):
            payload["column"] = "sse"
            payload["plate"] = "sh"
            payload["secid"] = f"{stock_code}.SH"
        elif stock_code.startswith("0") or stock_code.startswith("3"):
            payload["column"] = "szse"
            payload["plate"] = "sz"
            payload["secid"] = f"{stock_code}.SZ"
    
    try:
        with httpx.Client(timeout=30, headers=HEADERS) as client:
            resp = client.post(url, data=payload)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"[ERROR] 请求失败: {e}")
        return {"announcements": None, "totalRecordNum": 0}


# ============================================================
# 数据处理
# ============================================================

def is_relevant(title: str) -> bool:
    """判断公告是否与出海相关"""
    return any(kw in title for kw in RELEVANT_KEYWORDS)


def generate_unique_key(announcement: dict) -> str:
    """生成唯一标识"""
    key_str = f"juchao:{announcement.get('announcementId', '')}:{announcement.get('announcementTitle', '')}"
    return hashlib.md5(key_str.encode()).hexdigest()


def save_announcement(db: Session, announcement: dict) -> bool:
    """保存单条公告，返回True表示新插入"""
    unique_key = generate_unique_key(announcement)
    
    existing = db.query(Article).filter(Article.unique_key == unique_key).first()
    if existing:
        return False
    
    publish_time = announcement.get("announcementTime", "")
    try:
        if isinstance(publish_time, (int, float)) and publish_time > 1000000000000:
            publish_date = datetime.fromtimestamp(publish_time / 1000).date()
        elif publish_time:
            publish_date = datetime.strptime(str(publish_time)[:10], "%Y-%m-%d").date()
        else:
            publish_date = None
    except (ValueError, TypeError):
        publish_date = None
    
    content = announcement.get("announcementTitle", "")
    adjunct_url = announcement.get("adjunctUrl", "")
    if adjunct_url:
        content += f"\n\nPDF原文: {BASE_URL}{adjunct_url}"
    
    article = Article(
        source_id=SOURCE_ID,
        source_name=SOURCE_NAME,
        title=announcement.get("announcementTitle", "无标题"),
        url=f"{BASE_URL}/new/disclosure/detail?stockCode={announcement.get('stockCode', '')}&announcementId={announcement.get('announcementId', '')}",
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

def crawl_juchao(
    days_back: int = 7,
    max_pages: int = 5,
    full_market: bool = True,
) -> dict[str, Any]:
    """执行巨潮资讯爬虫"""
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    
    stats = {
        "source": SOURCE_NAME,
        "start_date": start_date,
        "end_date": end_date,
        "mode": "full_market" if full_market else "targeted",
        "total_fetched": 0,
        "new_inserted": 0,
        "skipped": 0,
        "errors": 0,
    }
    
    db = SessionLocal()
    try:
        if full_market:
            markets = [("sse", "sh", "沪市"), ("szse", "sz", "深市")]
            
            for column, plate, market_name in markets:
                print(f"[INFO] 抓取{market_name}公告...")
                
                for page in range(1, max_pages + 1):
                    try:
                        result = fetch_announcement_list(
                            page_num=page, page_size=30,
                            column=column, plate=plate,
                        )
                        
                        announcements = result.get("announcements") or []
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
                                    print(f"  [NEW][{market_name}] {title[:55]}...")
                                else:
                                    stats["skipped"] += 1
                            except Exception as e:
                                stats["errors"] += 1
                                print(f"  [ERROR] 入库: {e}")
                        
                        if not result.get("hasMore", False):
                            break
                        time.sleep(1)
                        
                    except Exception as e:
                        stats["errors"] += 1
                        print(f"[ERROR] {market_name}第{page}页: {e}")
                        break
                
                time.sleep(2)
    
    finally:
        db.close()
    
    return stats


def run_daily_update():
    """每日增量更新入口"""
    print("=" * 60)
    print(f"[START] 巨潮资讯爬虫 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    stats = crawl_juchao(days_back=1, max_pages=3)
    
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
    
    parser = argparse.ArgumentParser(description="巨潮资讯网爬虫")
    parser.add_argument("--days", type=int, default=7, help="回溯天数")
    parser.add_argument("--pages", type=int, default=5, help="最大页数")
    parser.add_argument("--daily", action="store_true", help="每日增量更新")
    parser.add_argument("--targeted", action="store_true", help="定向模式")
    
    args = parser.parse_args()
    
    if args.daily:
        run_daily_update()
    else:
        stats = crawl_juchao(
            days_back=args.days,
            max_pages=args.pages,
            full_market=not args.targeted,
        )
        print(json.dumps(stats, ensure_ascii=False, indent=2))
