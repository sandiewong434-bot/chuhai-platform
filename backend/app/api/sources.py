# -*- coding: utf-8 -*-
"""信源相关 API"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Article, SourceConfig, SourceLog
from app.schemas import SourceHealthResponse, SourceLogResponse

router = APIRouter(prefix="/sources", tags=["信源"])


@router.get("", response_model=list[SourceHealthResponse])
def list_sources(db: Session = Depends(get_db)):
    """获取所有信源的健康度状态"""
    # 最近7天
    week_ago = date.today() - timedelta(days=7)

    # 获取所有信源配置
    sources = db.query(SourceConfig).filter(SourceConfig.is_active == True).all()

    # 统计每个信源最近7天的文章数
    week_counts = (
        db.query(Article.source_id, func.count(Article.id).label("count"))
        .filter(Article.publish_date >= week_ago)
        .group_by(Article.source_id)
    )
    week_count_map = {r.source_id: r.count for r in week_counts}

    # 获取最近一次运行日志
    latest_logs = (
        db.query(
            SourceLog.source_id,
            func.max(SourceLog.run_at).label("last_run"),
        )
        .group_by(SourceLog.source_id)
        .subquery()
    )

    result = []
    for s in sources:
        result.append(
            SourceHealthResponse(
                source_id=s.source_id,
                name=s.name,
                is_active=s.is_active,
                library=s.library,
                crawl_tier=s.crawl_tier,
                network_issue=s.network_issue,
                last_run_at=None,  # TODO: 关联查询
                last_new_count=0,
                week_count=week_count_map.get(s.source_id, 0),
            )
        )

    return result


@router.get("/{source_id}/logs", response_model=list[SourceLogResponse])
def get_source_logs(
    source_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """获取某个信源的最近运行日志"""
    logs = (
        db.query(SourceLog)
        .filter(SourceLog.source_id == source_id)
        .order_by(desc(SourceLog.run_at))
        .limit(limit)
        .all()
    )
    return logs


@router.get("/stats/overview")
def get_sources_overview(db: Session = Depends(get_db)):
    """信源总体统计"""
    total = db.query(SourceConfig).filter(SourceConfig.is_active == True).count()

    by_tier = (
        db.query(SourceConfig.crawl_tier, func.count(SourceConfig.id).label("count"))
        .filter(SourceConfig.is_active == True)
        .group_by(SourceConfig.crawl_tier)
        .all()
    )

    by_library = (
        db.query(SourceConfig.library, func.count(SourceConfig.id).label("count"))
        .filter(SourceConfig.is_active == True)
        .group_by(SourceConfig.library)
        .all()
    )

    issue_count = (
        db.query(SourceConfig)
        .filter(SourceConfig.is_active == True, SourceConfig.network_issue == True)
        .count()
    )

    return {
        "total": total,
        "active": total,
        "with_issue": issue_count,
        "by_tier": [{"tier": r[0] or "unknown", "count": r[1]} for r in by_tier],
        "by_library": [{"library": r[0] or "unknown", "count": r[1]} for r in by_library],
    }
