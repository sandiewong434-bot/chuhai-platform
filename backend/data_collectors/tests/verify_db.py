#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证数据库中的指标数据"""
import sys
sys.path.insert(0, "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend")

from app.core.database import SessionLocal
from app.models import IndicatorPoint, IndicatorSeries

db = SessionLocal()

total = db.query(IndicatorPoint).count()
print(f"指标点总数: {total}")

series = db.query(IndicatorPoint).filter(IndicatorPoint.series_key == "lithium_capacity_production").count()
print(f"C001序列数: {series}")

# 查看样本数据
samples = db.query(IndicatorPoint).filter(
    IndicatorPoint.series_key == "lithium_capacity_production"
).order_by(IndicatorPoint.period_date.desc()).limit(5).all()

print("\n最近5条C001数据:")
for s in samples:
    dim = s.dimension_json or {}
    print(f"  {s.period_date} | {dim.get('metric', 'N/A')} = {s.value} {dim.get('unit', '')}")

# 查看指标序列定义
series_def = db.query(IndicatorSeries).filter(IndicatorSeries.series_key == "lithium_capacity_production").first()
if series_def:
    print(f"\n序列定义: {series_def.chart_name} ({series_def.chart_id}) | 来源: {series_def.source_name}")

db.close()
