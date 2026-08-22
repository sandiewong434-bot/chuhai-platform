#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量LLM标注脚本

用法：
    python batch_tag.py --limit 100           # 标注100篇未标注文章
    python batch_tag.py --all                 # 标注所有未标注文章
    python batch_tag.py --dry-run             # 预览模式，不写入数据库
    python batch_tag.py --source juchao       # 只标注指定信源的文章
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models import Article
from app.services.llm_tagger import batch_tag_articles


def main():
    parser = argparse.ArgumentParser(description="批量LLM标注")
    parser.add_argument("--limit", type=int, default=100, help="每次处理数量")
    parser.add_argument("--all", action="store_true", help="处理所有未标注文章")
    parser.add_argument("--dry-run", action="store_true", help="预览模式，不写入")
    parser.add_argument("--source", type=str, help="指定信源名称")
    parser.add_argument("--source-id", type=int, help="指定信源ID")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        # 查询未标注文章数量
        query = db.query(Article).filter(
            (Article.category_layer == None) | (Article.category_layer == "")
        )
        
        if args.source:
            query = query.filter(Article.source_name == args.source)
        if args.source_id:
            query = query.filter(Article.source_id == args.source_id)
        
        total_untagged = query.count()
        print(f"[INFO] 未标注文章总数: {total_untagged}")
        
        if total_untagged == 0:
            print("[INFO] 没有需要标注的文章")
            return
        
        limit = total_untagged if args.all else min(args.limit, total_untagged)
        
        print(f"[INFO] 本次处理: {limit} 篇")
        if args.dry_run:
            print("[INFO] 预览模式，不写入数据库")
        
        # 执行批量标注（使用规则标注，无LLM客户端时自动降级）
        stats = batch_tag_articles(db, limit=limit, llm_client=None, dry_run=args.dry_run)
        
        print("\n" + "=" * 50)
        print("[SUMMARY] 标注统计")
        print("=" * 50)
        print(f"  处理总数: {stats['total']}")
        print(f"  成功: {stats['success']}")
        print(f"  失败: {stats['failed']}")
        print(f"  应用标签数: {stats['tags_applied']}")
        if args.dry_run:
            print("  模式: 预览（未写入）")
        else:
            print("  模式: 已写入数据库")
        print("=" * 50)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
