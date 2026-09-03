# -*- coding: utf-8 -*-
"""指标数据查询 API

为前端图表提供时序数据查询接口
"""

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import IndicatorPoint, IndicatorSeries

router = APIRouter(prefix="/indicators", tags=["指标数据"])


@router.get("/series")
def list_series(
    category: str | None = None,
    chart_id: str | None = None,
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
):
    """获取指标序列列表"""
    query = db.query(IndicatorSeries)
    if category:
        query = query.filter(IndicatorSeries.category == category)
    if chart_id:
        query = query.filter(IndicatorSeries.chart_id == chart_id)
    if active_only:
        query = query.filter(IndicatorSeries.is_active == True)

    items = query.order_by(IndicatorSeries.category, IndicatorSeries.chart_id).all()
    return {
        "total": len(items),
        "items": [
            {
                "id": s.id,
                "series_key": s.series_key,
                "chart_id": s.chart_id,
                "chart_name": s.chart_name,
                "category": s.category,
                "source_name": s.source_name,
                "freq": s.freq,
                "unit": s.unit,
                "dimensions": s.dimensions,
                "last_sync_at": s.last_sync_at.isoformat() if s.last_sync_at else None,
            }
            for s in items
        ],
    }


@router.get("/series/{series_key}/points")
def get_series_points(
    series_key: str,
    period_from: date | None = None,
    period_to: date | None = None,
    metric: str | None = None,
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    """获取指定序列的时点数据

    参数:
        series_key: 序列标识，如 "lithium_capacity_production"
        period_from: 起始日期 (YYYY-MM-DD)
        period_to: 结束日期 (YYYY-MM-DD)
        metric: 维度过滤，如 "产量" / "产能" / "开工率"
        limit: 最大返回条数
    """
    query = db.query(IndicatorPoint).filter(IndicatorPoint.series_key == series_key)

    if period_from:
        query = query.filter(IndicatorPoint.period_date >= period_from)
    if period_to:
        query = query.filter(IndicatorPoint.period_date <= period_to)

    # 按日期升序
    items = query.order_by(IndicatorPoint.period_date).limit(limit).all()

    # 过滤指定 metric
    if metric:
        items = [i for i in items if (i.dimension_json or {}).get("metric") == metric]

    return {
        "series_key": series_key,
        "total": len(items),
        "items": [
            {
                "period_date": i.period_date.isoformat() if i.period_date else None,
                "period_type": i.period_type,
                "value": float(i.value) if i.value is not None else None,
                "value_yoy": float(i.value_yoy) if i.value_yoy is not None else None,
                "value_mom": float(i.value_mom) if i.value_mom is not None else None,
                "dimension_json": i.dimension_json,
                "confidence": i.confidence,
            }
            for i in items
        ],
    }


@router.get("/chart/{chart_id}")
def get_chart_data(
    chart_id: str,
    period_from: date | None = None,
    period_to: date | None = None,
    db: Session = Depends(get_db),
):
    """按 chart_id 聚合获取图表数据（支持多序列）"""
    series_list = (
        db.query(IndicatorSeries)
        .filter(IndicatorSeries.chart_id == chart_id)
        .filter(IndicatorSeries.is_active == True)
        .all()
    )

    if not series_list:
        raise HTTPException(status_code=404, detail=f"未找到 chart_id={chart_id} 的指标序列")

    result = {
        "chart_id": chart_id,
        "series": [],
    }

    for s in series_list:
        query = db.query(IndicatorPoint).filter(IndicatorPoint.series_key == s.series_key)
        if period_from:
            query = query.filter(IndicatorPoint.period_date >= period_from)
        if period_to:
            query = query.filter(IndicatorPoint.period_date <= period_to)

        points = query.order_by(IndicatorPoint.period_date).limit(500).all()

        result["series"].append({
            "series_key": s.series_key,
            "chart_name": s.chart_name,
            "unit": s.unit,
            "freq": s.freq,
            "points": [
                {
                    "period_date": p.period_date.isoformat() if p.period_date else None,
                    "value": float(p.value) if p.value is not None else None,
                    "dimension_json": p.dimension_json,
                }
                for p in points
            ],
        })

    return result


@router.get("/latest")
def get_latest_points(
    series_keys: str | None = Query(None, description="逗号分隔的序列key，如 lithium_capacity_production,lithium_price"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """获取多个序列的最新数据"""
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)

    query = db.query(IndicatorPoint).filter(IndicatorPoint.period_date >= cutoff)
    if series_keys:
        keys = [k.strip() for k in series_keys.split(",")]
        query = query.filter(IndicatorPoint.series_key.in_(keys))

    items = query.order_by(desc(IndicatorPoint.period_date)).limit(200).all()

    # 按 series_key 分组
    grouped: dict[str, list] = {}
    for i in items:
        sk = i.series_key
        if sk not in grouped:
            grouped[sk] = []
        grouped[sk].append({
            "period_date": i.period_date.isoformat() if i.period_date else None,
            "value": float(i.value) if i.value is not None else None,
            "dimension_json": i.dimension_json,
        })

    return {"days": days, "data": grouped}
