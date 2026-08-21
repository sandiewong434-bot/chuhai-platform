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
- 正文内容（从 PDF 提取或从详情页获取）
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

# 允许从项目根目录导入
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models import Article, SourceConfig


# ============================================================
# 配置
# ============================================================

SOURCE_ID = 1  # 对应 sources.json 中的 id
SOURCE_NAME = "巨潮资讯网"
BASE_URL = "http://www.cninfo.com.cn"

# NEV 相关上市公司代码（重点关注）
TARGET_COMPANIES = [
    "002594",  # 比亚迪
    "300750",  # 宁德时代
    "9866",    # 蔚来-SW
    "9868",    # 小鹏汽车-SW
    "2015",    # 理想汽车-SW
    "0175",    # 吉利汽车
    "600104",  # 上汽集团
    "601633",  # 长城汽车
    "601127",  # 赛力斯
    "002048",  # 宁波华翔
]

# 公告类型筛选（出海相关）
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
    start_date: str | None = None,
    end_date: str | None = None,
    stock_code: str | None = None,
) -> dict[str, Any]:
    """
    获取公告列表
    
    API 端点：/new/hisAnnouncement/query
    """
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    url = f"{BASE_URL}/new/hisAnnouncement/query"
    
    payload = {
        "pageNum": page_num,
        "pageSize": page_size,
        "column": "szse",  # 深交所
        "tabName": "fulltext",
        "stock": stock_code,
        "searchkey": "",
        "secid": "",
        "plate": "sz",  # 深圳
        "category": "category_ndbg_szsh",  # 年度报告
        "trade": "",
        "columnTitle": "历年公告",
        "pageNo": page_num,
    }
    
    # 如果指定了公司代码，修改查询参数
    if stock_code:
        payload["stock"] = stock_code
        payload["secid"] = f"{stock_code}.SZ"
    
    try:
        with httpx.Client(timeout=30, headers=HEADERS) as client:
            resp = client.post(url, data=payload)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"[ERROR] 请求失败: {e}")
        return {"announcements": [], "totalRecordNum": 0}


def fetch_announcement_detail(announcement_id: str, adjuct_url: str | None = None) -> dict[str, Any]:
    """
    获取公告详情（PDF 链接或 HTML 内容）
    
    巨潮资讯的公告详情通常直接提供 PDF 下载链接
    """
    if adjuct_url:
        # 直接构造 PDF 链接
        pdf_url = f"{BASE_URL}{adjuct_url}"
        return {"pdf_url": pdf_url, "html_content": None}
    
    return {"pdf_url": None, "html_content": None}


def is_relevant(title: str) -> bool:
    """判断公告是否与 NEV 出海相关"""
    title_lower = title.lower()
    return any(kw in title_lower for kw in RELEVANT_KEYWORDS)


def generate_unique_key(announcement: dict) -> str:
    """生成唯一标识，用于去重"""
    key_str = f"juchao:{announcement.get('announcementId', '')}:{announcement.get('announcementTitle', '')}"
    return hashlib.md5(key_str.encode()).hexdigest()


# ============================================================
# 数据入库
# ============================================================

def save_announcement(db: Session, announcement: dict) -> bool:
    """
    将单条公告保存到数据库
    
    Returns:
        True 表示新插入，False 表示已存在
    """
    unique_key = generate_unique_key(announcement)
    
    # 检查是否已存在
    existing = db.query(Article).filter(Article.unique_key == unique_key).first()
    if existing:
        return False
    
    # 解析日期
    publish_time = announcement.get("announcementTime", "")
    try:
        if publish_time:
            publish_date = datetime.strptime(publish_time[:10], "%Y-%m-%d").date()
        else:
            publish_date = None
    except ValueError:
        publish_date = None
    
    # 构造正文（先存标题作为内容占位，后续可补充 PDF 解析）
    content = announcement.get("announcementTitle", "")
    adjuct_url = announcement.get("adjunctUrl", "")
    if adjuct_url:
        pdf_url = f"{BASE_URL}{adjuct_url}"
        content += f"\n\nPDF原文: {pdf_url}"
    
    article = Article(
        source_id=SOURCE_ID,
        source_name=SOURCE_NAME,
        title=announcement.get("announcementTitle", "无标题"),
        url=f"{BASE_URL}/new/disclosure/detail?stockCode={announcement.get('stockCode', '')}&announcementId={announcement.get('announcementId', '')}",
        publish_date=publish_date,
        unique_key=unique_key,
        content=content[:5000],  # 先限制长度
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
    target_companies: list[str] | None = None,
) -> dict[str, Any]:
    """
    执行巨潮资讯爬虫
    
    Args:
        days_back: 回溯天数
        max_pages: 每个公司最大抓取页数
        target_companies: 目标公司代码列表
    
    Returns:
        统计信息
    """
    if target_companies is None:
        target_companies = TARGET_COMPANIES
    
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    
    stats = {
        "source": SOURCE_NAME,
        "start_date": start_date,
        "end_date": end_date,
        "companies_checked": len(target_companies),
        "total_fetched": 0,
        "new_inserted": 0,
        "skipped": 0,
        "errors": 0,
    }
    
    db = SessionLocal()
    try:
        for stock_code in target_companies:
            print(f"[INFO] 正在抓取公司: {stock_code}")
            
            for page in range(1, max_pages + 1):
                try:
                    result = fetch_announcement_list(
                        page_num=page,
                        page_size=30,
                        start_date=start_date,
                        end_date=end_date,
                        stock_code=stock_code,
                    )
                    
                    announcements = result.get("announcements", [])
                    if not announcements:
                        break
                    
                    for announcement in announcements:
                        stats["total_fetched"] += 1
                        
                        # 相关性筛选
                        title = announcement.get("announcementTitle", "")
                        if not is_relevant(title):
                            stats["skipped"] += 1
                            continue
                        
                        # 入库
                        try:
                            is_new = save_announcement(db, announcement)
                            if is_new:
                                stats["new_inserted"] += 1
                                print(f"  [NEW] {title[:60]}...")
                            else:
                                stats["skipped"] += 1
                        except Exception as e:
                            stats["errors"] += 1
                            print(f"  [ERROR] 入库失败: {e}")
                    
                    # 礼貌等待
                    time.sleep(1)
                    
                except Exception as e:
                    stats["errors"] += 1
                    print(f"[ERROR] 抓取第 {page} 页失败: {e}")
                    break
            
            # 公司间等待
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
    print("[SUMMARY] 抓取统计")
    print(f"  抓取时间范围: {stats['start_date']} ~ {stats['end_date']}")
    print(f"  检查公司数: {stats['companies_checked']}")
    print(f"  总获取: {stats['total_fetched']}")
    print(f"  新入库: {stats['new_inserted']}")
    print(f"  跳过/重复: {stats['skipped']}")
    print(f"  错误: {stats['errors']}")
    print("=" * 60)
    
    return stats


# ============================================================
# CLI 入口
# ============================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="巨潮资讯网爬虫")
    parser.add_argument("--days", type=int, default=7, help="回溯天数")
    parser.add_argument("--pages", type=int, default=5, help="每公司最大页数")
    parser.add_argument("--company", type=str, default=None, help="指定公司代码")
    parser.add_argument("--daily", action="store_true", help="执行每日增量更新")
    
    args = parser.parse_args()
    
    if args.daily:
        run_daily_update()
    else:
        companies = [args.company] if args.company else TARGET_COMPANIES
        stats = crawl_juchao(
            days_back=args.days,
            max_pages=args.pages,
            target_companies=companies,
        )
        print(json.dumps(stats, ensure_ascii=False, indent=2))
