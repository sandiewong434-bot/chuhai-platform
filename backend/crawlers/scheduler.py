#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
爬虫调度器
管理所有信源的定时抓取任务

用法：
    python scheduler.py --source juchao --daily      # 运行巨潮资讯日更新
    python scheduler.py --all --daily               # 运行所有信源日更新
    python scheduler.py --list                      # 列出所有已配置信源
    python scheduler.py --import-sources            # 导入信源配置到数据库
    python scheduler.py --generic --daily           # 运行通用爬虫（所有auto_html信源）
    python scheduler.py --generic --source-id 1     # 运行指定ID的通用爬虫
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models import SourceLog

# 导入爬虫模块
from crawlers.juchao import crawl_juchao as crawl_juchao_impl, SOURCE_NAME as JUCHAO_NAME
from crawlers.hkex import crawl_hkex as crawl_hkex_impl, SOURCE_NAME as HKEX_NAME
from crawlers.generic_crawler import (
    crawl_all_active,
    crawl_source_by_id,
    import_sources_to_db,
    load_source_config,
    batch_fetch_contents,
)


# 注册专用爬虫（需单独维护的复杂爬虫）
CRAWLERS = {
    "juchao": {
        "name": JUCHAO_NAME,
        "func": crawl_juchao_impl,
        "default_days": 1,
        "default_pages": 3,
    },
    "hkex": {
        "name": HKEX_NAME,
        "func": crawl_hkex_impl,
        "default_days": 1,
        "default_pages": 2,
    },
}


def log_run(db, source_id: int, source_name: str, status: str, new_count: int, total: int, error: str | None = None, duration: int = 0):
    """记录爬虫运行日志"""
    log = SourceLog(
        source_id=source_id,
        source_name=source_name,
        status=status,
        new_count=new_count,
        total_fetched=total,
        error_message=error,
        duration_sec=duration,
    )
    db.add(log)
    db.commit()


def run_source(source_key: str, days_back: int = 1) -> dict:
    """运行单个专用爬虫"""
    if source_key not in CRAWLERS:
        print(f"[ERROR] 未知信源: {source_key}")
        print(f"[INFO] 可用信源: {', '.join(CRAWLERS.keys())}")
        return {"error": "未知信源"}
    
    config = CRAWLERS[source_key]
    print(f"\n{'='*60}")
    print(f"[START] {config['name']} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    start_time = time.time()
    db = SessionLocal()
    
    try:
        stats = config["func"](
            days_back=days_back,
            max_pages=config.get("default_pages", 3),
        )
        
        duration = int(time.time() - start_time)
        status = "success" if stats.get("errors", 0) == 0 else "partial"
        
        log_run(
            db=db,
            source_id=list(CRAWLERS.keys()).index(source_key) + 1,
            source_name=config["name"],
            status=status,
            new_count=stats.get("new_inserted", 0),
            total=stats.get("total_fetched", 0),
            duration=duration,
        )
        
        print(f"\n[SUMMARY] {config['name']}")
        print(f"  新入库: {stats.get('new_inserted', 0)}")
        print(f"  总获取: {stats.get('total_fetched', 0)}")
        print(f"  耗时: {duration}秒")
        print(f"{'='*60}\n")
        
        return stats
        
    except Exception as e:
        duration = int(time.time() - start_time)
        log_run(
            db=db,
            source_id=list(CRAWLERS.keys()).index(source_key) + 1,
            source_name=config["name"],
            status="failed",
            new_count=0,
            total=0,
            error=str(e)[:500],
            duration=duration,
        )
        print(f"[ERROR] {config['name']} 运行失败: {e}")
        return {"error": str(e)}
    
    finally:
        db.close()


def run_all(days_back: int = 1):
    """运行所有专用爬虫"""
    results = {}
    for key in CRAWLERS:
        results[key] = run_source(key, days_back)
        time.sleep(5)
    return results


def list_sources():
    """列出所有已配置信源"""
    print("=" * 60)
    print("专用爬虫（需单独维护）:")
    print("=" * 60)
    for key, config in CRAWLERS.items():
        print(f"  {key}: {config['name']}")
    
    print("\n" + "=" * 60)
    print("通用爬虫配置（sources_catalog.json）:")
    print("=" * 60)
    sources = load_source_config()
    auto_html = [s for s in sources if s.get("crawl_tier") == "auto_html"]
    manual = [s for s in sources if s.get("crawl_tier") == "manual_or_js"]
    print(f"  auto_html 可自动抓取: {len(auto_html)} 个")
    print(f"  manual_or_js 需人工处理: {len(manual)} 个")
    print(f"  总计: {len(sources)} 个")
    
    print("\n  auto_html 信源列表:")
    for s in auto_html:
        flag = "[NET_ISSUE]" if s.get("network_issue") else ""
        print(f"    ID{s['id']:2d}: {s['name']:<30s} ({s.get('library', '未分类')}) {flag}")


def run_generic_all(days_back: int = 7, max_pages: int = 2, auto_fetch_content: bool = True, content_limit: int = 50):
    """运行所有通用爬虫，可选自动抓取正文"""
    print(f"\n{'='*60}")
    print(f"[START] 通用爬虫批量抓取 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    start_time = time.time()
    db = SessionLocal()
    
    try:
        results = crawl_all_active(db=db, max_pages=max_pages, days_back=days_back)
        
        duration = int(time.time() - start_time)
        total_new = sum(r.get("new_inserted", 0) for r in results.values() if isinstance(r, dict))
        total_fetch = sum(r.get("total_fetched", 0) for r in results.values() if isinstance(r, dict))
        errors = sum(1 for r in results.values() if isinstance(r, dict) and "error" in r)
        
        log_run(
            db=db,
            source_id=0,
            source_name="通用爬虫批量",
            status="success" if errors == 0 else "partial",
            new_count=total_new,
            total=total_fetch,
            duration=duration,
        )
        
        print(f"\n[SUMMARY] 通用爬虫批量抓取")
        print(f"  信源数: {len(results)}")
        print(f"  新入库: {total_new}")
        print(f"  总获取: {total_fetch}")
        print(f"  失败: {errors}")
        print(f"  耗时: {duration}秒")
        print(f"{'='*60}\n")
        
        # 自动抓取正文（新入库的文章）
        if auto_fetch_content and total_new > 0:
            print(f"[AUTO] 开始自动抓取新入库文章正文（上限 {content_limit} 条）...")
            content_stats = batch_fetch_contents(
                db=db,
                limit=content_limit,
                skip_existing=True,
            )
            print(f"[AUTO] 正文抓取完成: 成功 {content_stats['success']}, 失败 {content_stats['failed']}\n")
        
        return results
        
    except Exception as e:
        duration = int(time.time() - start_time)
        log_run(
            db=db,
            source_id=0,
            source_name="通用爬虫批量",
            status="failed",
            new_count=0,
            total=0,
            error=str(e)[:500],
            duration=duration,
        )
        print(f"[ERROR] 通用爬虫批量运行失败: {e}")
        return {"error": str(e)}
    
    finally:
        db.close()


def run_generic_one(source_id: int, days_back: int = 7, max_pages: int = 2, auto_fetch_content: bool = True, content_limit: int = 30):
    """运行单个通用爬虫，可选自动抓取正文"""
    source_config = next((s for s in load_source_config() if s.get("id") == source_id), None)
    if not source_config:
        print(f"[ERROR] 信源ID {source_id} 不存在")
        return {"error": "信源不存在"}
    
    print(f"\n{'='*60}")
    print(f"[START] {source_config['name']} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    start_time = time.time()
    db = SessionLocal()
    
    try:
        stats = crawl_source_by_id(source_id, db=db, max_pages=max_pages, days_back=days_back)
        
        duration = int(time.time() - start_time)
        status = "success" if "error" not in stats else "failed"
        
        log_run(
            db=db,
            source_id=source_id,
            source_name=source_config["name"],
            status=status,
            new_count=stats.get("new_inserted", 0),
            total=stats.get("total_fetched", 0),
            error=stats.get("error"),
            duration=duration,
        )
        
        print(f"\n[SUMMARY] {source_config['name']}")
        print(f"  新入库: {stats.get('new_inserted', 0)}")
        print(f"  总获取: {stats.get('total_fetched', 0)}")
        print(f"  耗时: {duration}秒")
        print(f"{'='*60}\n")
        
        # 自动抓取正文（仅本信源新入库的文章）
        new_inserted = stats.get("new_inserted", 0)
        if auto_fetch_content and new_inserted > 0:
            print(f"[AUTO] 开始自动抓取 {source_config['name']} 新入库文章正文...")
            content_stats = batch_fetch_contents(
                db=db,
                source_id=source_id,
                limit=max(content_limit, new_inserted),
                skip_existing=True,
            )
            print(f"[AUTO] 正文抓取完成: 成功 {content_stats['success']}, 失败 {content_stats['failed']}\n")
        
        return stats
        
    except Exception as e:
        duration = int(time.time() - start_time)
        log_run(
            db=db,
            source_id=source_id,
            source_name=source_config["name"],
            status="failed",
            new_count=0,
            total=0,
            error=str(e)[:500],
            duration=duration,
        )
        print(f"[ERROR] {source_config['name']} 运行失败: {e}")
        return {"error": str(e)}
    
    finally:
        db.close()


def do_import_sources():
    """导入信源配置到数据库"""
    count = import_sources_to_db()
    print(f"[DONE] 已导入 {count} 个信源配置")
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="爬虫调度器")
    parser.add_argument("--source", type=str, help="指定专用爬虫信源（如 juchao）")
    parser.add_argument("--all", action="store_true", help="运行所有专用爬虫")
    parser.add_argument("--generic", action="store_true", help="运行通用爬虫")
    parser.add_argument("--source-id", type=int, help="指定通用爬虫信源ID")
    parser.add_argument("--daily", action="store_true", help="每日增量模式（1天）")
    parser.add_argument("--days", type=int, default=7, help="回溯天数")
    parser.add_argument("--pages", type=int, default=2, help="最大页数（通用爬虫）")
    parser.add_argument("--list", action="store_true", help="列出信源")
    parser.add_argument("--import-sources", action="store_true", help="导入信源配置到数据库")
    parser.add_argument("--no-content", action="store_true", help="禁用自动正文抓取")
    
    args = parser.parse_args()
    
    auto_fetch = not args.no_content
    
    if args.list:
        list_sources()
    elif args.import_sources:
        do_import_sources()
    elif args.generic:
        if args.source_id:
            days = 1 if args.daily else args.days
            run_generic_one(args.source_id, days_back=days, max_pages=args.pages, auto_fetch_content=auto_fetch)
        else:
            days = 1 if args.daily else args.days
            run_generic_all(days_back=days, max_pages=args.pages, auto_fetch_content=auto_fetch)
    elif args.all:
        days = 1 if args.daily else args.days
        run_all(days)
    elif args.source:
        days = 1 if args.daily else args.days
        run_source(args.source, days)
    else:
        parser.print_help()
