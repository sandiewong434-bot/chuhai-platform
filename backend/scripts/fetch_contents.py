#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量正文抓取脚本

用法：
    python fetch_contents.py --limit 50                    # 抓取50条无正文的记录
    python fetch_contents.py --source-id 1 --limit 30      # 仅抓取指定信源
    python fetch_contents.py --fill-dates --limit 100      # 补全缺失日期
    python fetch_contents.py --all                         # 抓取所有无正文记录（慎用）
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from crawlers.generic_crawler import batch_fetch_contents, fill_missing_dates


def main():
    parser = argparse.ArgumentParser(description="批量抓取文章正文")
    parser.add_argument("--source-id", type=int, default=None, help="指定信源ID")
    parser.add_argument("--limit", type=int, default=50, help="最大处理数量（默认50）")
    parser.add_argument("--all", action="store_true", help="处理所有记录（覆盖limit限制为10000）")
    parser.add_argument("--fill-dates", action="store_true", help="仅补全缺失日期")
    parser.add_argument("--include-existing", action="store_true", help="包括已有正文的记录（重新抓取）")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        if args.fill_dates:
            print("=" * 60)
            print("开始补全缺失的发布日期...")
            print("=" * 60)
            limit = 10000 if args.all else args.limit
            stats = fill_missing_dates(db, limit=limit)
            print(f"\n日期补全完成: 成功 {stats['success']}, 失败 {stats['failed']}")
        else:
            print("=" * 60)
            print("开始批量抓取文章正文...")
            print("=" * 60)
            limit = 10000 if args.all else args.limit
            stats = batch_fetch_contents(
                db,
                source_id=args.source_id,
                limit=limit,
                skip_existing=not args.include_existing,
            )
            print(f"\n正文抓取完成: 成功 {stats['success']}, 失败 {stats['failed']}, 总计 {stats['total']}")
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
