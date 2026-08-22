#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
国别评分计算脚本

用法：
    python refresh_scores.py              # 刷新所有国家评分
    python refresh_scores.py --industry NEV  # 指定行业
    python refresh_scores.py --dry-run    # 预览模式
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.services.scoring_engine import refresh_all_scores


def main():
    import argparse
    parser = argparse.ArgumentParser(description="国别评分计算")
    parser.add_argument("--industry", type=str, default="NEV", help="行业")
    parser.add_argument("--dry-run", action="store_true", help="预览模式")
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        print("=" * 60)
        print("开始计算国别评分...")
        print("=" * 60)
        
        result = refresh_all_scores(db, industry=args.industry)
        
        print(f"\n[RESULT] 计算完成:")
        print(f"  计算国家数: {result['calculated']}")
        print(f"  保存记录数: {result['saved']}")
        print(f"\n[TOP3] 评分最高的国家:")
        for i, c in enumerate(result['top3'], 1):
            print(f"  {i}. {c['name']} ({c['code']}): {c['score']}分 - {c['level']}")
        
        print("=" * 60)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
