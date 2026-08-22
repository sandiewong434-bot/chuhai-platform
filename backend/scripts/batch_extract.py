#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量本体关系抽取脚本

用法：
    python batch_extract.py --limit 50        # 抽取50篇文章
    python batch_extract.py --all             # 抽取所有文章
    python batch_extract.py --dry-run         # 预览模式
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models import Article, Relation
from app.services.llm_tagger import _rule_extract_relations, save_relations


def main():
    import argparse
    parser = argparse.ArgumentParser(description="批量本体关系抽取")
    parser.add_argument("--limit", type=int, default=50, help="处理数量")
    parser.add_argument("--all", action="store_true", help="处理所有文章")
    parser.add_argument("--dry-run", action="store_true", help="预览模式")
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        # 查询有正文且未抽取关系的文章
        # 简单策略：抽取所有有正文的文章（去重由save_relations处理）
        query = db.query(Article).filter(Article.content != None)
        total = query.count()
        limit = total if args.all else min(args.limit, total)
        
        articles = query.order_by(Article.id.desc()).limit(limit).all()
        
        print(f"[INFO] 总文章数: {total}, 本次处理: {len(articles)}")
        if args.dry_run:
            print("[INFO] 预览模式，不写入数据库\n")
        
        total_rels = 0
        for i, article in enumerate(articles):
            relations = _rule_extract_relations(
                title=article.title,
                content=article.content or "",
                article_id=article.id,
            )
            
            if relations:
                print(f"[{i+1}/{len(articles)}] ID={article.id} 抽取到 {len(relations)} 条关系: {article.title[:50]}...")
                for rel in relations:
                    print(f"    {rel['from_obj']} --[{rel['rel_type']}]--> {rel['to_obj']}")
                
                if not args.dry_run:
                    count = save_relations(db, relations)
                    total_rels += count
            
        print(f"\n[SUMMARY] 总计抽取关系: {total_rels} 条")
        
        # 统计当前关系总数
        rel_total = db.query(Relation).count()
        print(f"[SUMMARY] 数据库关系总数: {rel_total} 条")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
