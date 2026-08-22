#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
爬虫调度器
管理所有信源的定时抓取任务

用法：
    python scheduler.py --source juchao --daily      # 运行巨潮资讯日更新
    python scheduler.py --all --daily               # 运行所有信源日更新
    python scheduler.py --list                      # 列出所有已配置信源
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


# 注册所有爬虫
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
    # 后续在这里注册更多爬虫
    # "mofcom": { "name": "商务部", "func": crawl_mofcom, ... },
    # "trade_remedy": { "name": "贸易救济信息网", "func": crawl_trade_remedy, ... },
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
    """运行单个信源的爬虫"""
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
    """运行所有已配置信源"""
    results = {}
    for key in CRAWLERS:
        results[key] = run_source(key, days_back)
        time.sleep(5)  # 信源间间隔
    return results


def list_sources():
    """列出所有已配置信源"""
    print("已配置信源列表:")
    for key, config in CRAWLERS.items():
        print(f"  {key}: {config['name']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="爬虫调度器")
    parser.add_argument("--source", type=str, help="指定信源（如 juchao）")
    parser.add_argument("--all", action="store_true", help="运行所有信源")
    parser.add_argument("--daily", action="store_true", help="每日增量模式（1天）")
    parser.add_argument("--days", type=int, default=7, help="回溯天数")
    parser.add_argument("--list", action="store_true", help="列出信源")
    
    args = parser.parse_args()
    
    if args.list:
        list_sources()
    elif args.all:
        days = 1 if args.daily else args.days
        run_all(days)
    elif args.source:
        days = 1 if args.daily else args.days
        run_source(args.source, days)
    else:
        parser.print_help()
