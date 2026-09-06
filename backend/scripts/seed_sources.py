#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Seed source configurations and logs into the database."""

import sys
from datetime import datetime, timedelta

sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from app.core.database import SessionLocal
from app.models import SourceConfig, SourceLog

# Article sources with their metadata
ARTICLE_SOURCES = [
    {"source_id": 1, "name": "巨潮资讯网", "library": "L1", "crawl_tier": "T1", "category_tag": "G1-L1.01", "nev_relevance": "高", "org_type": "官方信息平台"},
    {"source_id": 2, "name": "欧盟EUR-Lex", "library": "L9", "crawl_tier": "T1", "category_tag": "G9-L1.04", "nev_relevance": "高", "org_type": "政府法规库"},
    {"source_id": 3, "name": "商务部对外投资", "library": "L5", "crawl_tier": "T1", "category_tag": "G5-L1.03", "nev_relevance": "高", "org_type": "政府机构"},
    {"source_id": 4, "name": "蔚来官方", "library": "L5", "crawl_tier": "T2", "category_tag": "G5-L1.03", "nev_relevance": "高", "org_type": "企业官方"},
    {"source_id": 5, "name": "美国USTR", "library": "L9", "crawl_tier": "T1", "category_tag": "G9-L1.04", "nev_relevance": "高", "org_type": "政府机构"},
    {"source_id": 6, "name": "中国贸易救济信息网", "library": "L9", "crawl_tier": "T1", "category_tag": "G9-L1.04", "nev_relevance": "高", "org_type": "官方信息平台"},
    {"source_id": 7, "name": "德国汽车周刊", "library": "L5", "crawl_tier": "T2", "category_tag": "G5-L1.03", "nev_relevance": "中", "org_type": "行业媒体"},
    {"source_id": 8, "name": "中国汽车工业协会", "library": "L6", "crawl_tier": "T1", "category_tag": "G6-L1.05", "nev_relevance": "高", "org_type": "行业协会"},
    {"source_id": 9, "name": "欧洲汽车制造商协会", "library": "L6", "crawl_tier": "T2", "category_tag": "G6-L1.05", "nev_relevance": "中", "org_type": "行业协会"},
    {"source_id": 10, "name": "极氪官方", "library": "L5", "crawl_tier": "T2", "category_tag": "G5-L1.03", "nev_relevance": "高", "org_type": "企业官方"},
    {"source_id": 11, "name": "巴西Anfavea", "library": "L6", "crawl_tier": "T2", "category_tag": "G6-L1.05", "nev_relevance": "中", "org_type": "行业协会"},
    {"source_id": 12, "name": "匈牙利HIPA", "library": "L5", "crawl_tier": "T2", "category_tag": "G5-L1.03", "nev_relevance": "中", "org_type": "投资促进机构"},
    {"source_id": 13, "name": "理想官方", "library": "L5", "crawl_tier": "T2", "category_tag": "G5-L1.03", "nev_relevance": "高", "org_type": "企业官方"},
    {"source_id": 14, "name": "高工锂电", "library": "L3", "crawl_tier": "T2", "category_tag": "G3-L1.02", "nev_relevance": "高", "org_type": "行业研究机构"},
    {"source_id": 15, "name": "路透社", "library": "L5", "crawl_tier": "T1", "category_tag": "G5-L1.03", "nev_relevance": "中", "org_type": "国际媒体"},
    {"source_id": 16, "name": "广汽集团", "library": "L5", "crawl_tier": "T2", "category_tag": "G5-L1.03", "nev_relevance": "高", "org_type": "企业官方"},
    {"source_id": 17, "name": "S&P Global", "library": "L6", "crawl_tier": "T1", "category_tag": "G6-L1.05", "nev_relevance": "中", "org_type": "研究机构"},
    {"source_id": 18, "name": "ANCAP", "library": "L9", "crawl_tier": "T2", "category_tag": "G9-L1.04", "nev_relevance": "高", "org_type": "安全评测机构"},
    {"source_id": 19, "name": "商务部", "library": "L9", "crawl_tier": "T1", "category_tag": "G9-L1.04", "nev_relevance": "高", "org_type": "政府机构"},
    {"source_id": 20, "name": "荷兰汽车进口协会", "library": "L6", "crawl_tier": "T2", "category_tag": "G6-L1.05", "nev_relevance": "中", "org_type": "行业协会"},
]

# Indicator data sources
INDICATOR_SOURCES = [
    {"source_id": 101, "name": "海关总署 / 中汽协 (出口数据)", "library": "C", "crawl_tier": "T1", "category_tag": "C001-C012", "nev_relevance": "高", "org_type": "政府机构"},
    {"source_id": 102, "name": "荣鼎集团 (投资流向)", "library": "C", "crawl_tier": "T1", "category_tag": "C012-C014", "nev_relevance": "高", "org_type": "研究机构"},
    {"source_id": 103, "name": "SNE Research (电池装机)", "library": "E", "crawl_tier": "T1", "category_tag": "E006-E007", "nev_relevance": "高", "org_type": "行业研究机构"},
    {"source_id": 104, "name": "乘联会 (车企销量)", "library": "G", "crawl_tier": "T1", "category_tag": "G003", "nev_relevance": "高", "org_type": "行业协会"},
    {"source_id": 105, "name": "IEA / 中国充电联盟 (充电桩)", "library": "E", "crawl_tier": "T2", "category_tag": "E004", "nev_relevance": "高", "org_type": "国际组织"},
    {"source_id": 106, "name": "高工GGII (电池产能)", "library": "E", "crawl_tier": "T2", "category_tag": "E006", "nev_relevance": "高", "org_type": "行业研究机构"},
    {"source_id": 107, "name": "EV-Volumes (全球销量)", "library": "C", "crawl_tier": "T1", "category_tag": "C018", "nev_relevance": "高", "org_type": "研究机构"},
    {"source_id": 108, "name": "OICA / 世界银行 (保有量)", "library": "C", "crawl_tier": "T2", "category_tag": "C019", "nev_relevance": "中", "org_type": "国际组织"},
    {"source_id": 109, "name": "SMM / 百川盈孚 (锂盐数据)", "library": "E", "crawl_tier": "T1", "category_tag": "E001-E002", "nev_relevance": "高", "org_type": "数据服务商"},
    {"source_id": 110, "name": "MarkLines (全球车企)", "library": "G", "crawl_tier": "T2", "category_tag": "G003", "nev_relevance": "中", "org_type": "行业数据库"},
]

def main():
    db = SessionLocal()
    try:
        # Clear existing sources
        db.query(SourceConfig).delete()
        db.query(SourceLog).delete()

        all_sources = ARTICLE_SOURCES + INDICATOR_SOURCES
        now = datetime.utcnow()

        for src in all_sources:
            config = SourceConfig(
                source_id=src["source_id"],
                name=src["name"],
                library=src["library"],
                crawl_tier=src["crawl_tier"],
                category_tag=src["category_tag"],
                nev_relevance=src["nev_relevance"],
                org_type=src["org_type"],
                is_active=True,
                network_issue=False,
                created_at=now,
                updated_at=now,
            )
            db.add(config)

        # Add some recent logs
        for src in all_sources[:15]:
            for days_ago in [0, 1, 2]:
                log = SourceLog(
                    source_id=src["source_id"],
                    source_name=src["name"],
                    run_at=now - timedelta(days=days_ago, hours=days_ago * 3),
                    status="success" if days_ago < 2 else "success",
                    new_count=3 + days_ago,
                    total_fetched=12 + days_ago * 2,
                    duration_sec=15 + days_ago,
                    created_at=now,
                )
                db.add(log)

        # Add a few error logs for realism
        error_sources = ["欧盟EUR-Lex", "美国USTR"]
        for name in error_sources:
            src = next((s for s in all_sources if s["name"] == name), None)
            if src:
                log = SourceLog(
                    source_id=src["source_id"],
                    source_name=src["name"],
                    run_at=now - timedelta(hours=6),
                    status="error",
                    new_count=0,
                    total_fetched=0,
                    error_message="连接超时 (HTTP 504)",
                    duration_sec=30,
                    created_at=now,
                )
                db.add(log)
                # Mark source as having network issue
                db.query(SourceConfig).filter(SourceConfig.source_id == src["source_id"]).update({"network_issue": True})

        db.commit()
        print(f"✅ Seeded {len(all_sources)} sources and logs")

        # Verify
        total = db.query(SourceConfig).filter(SourceConfig.is_active == True).count()
        with_issue = db.query(SourceConfig).filter(SourceConfig.is_active == True, SourceConfig.network_issue == True).count()
        print(f"   Active sources: {total}")
        print(f"   With issues: {with_issue}")
        print(f"   Logs: {db.query(SourceLog).count()}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
