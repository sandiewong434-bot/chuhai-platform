# -*- coding: utf-8 -*-
"""
海外投资数据 collectors
========================
C012 海外投资目的国TOP10
C013 海外投资金额TOP10企业
C014 产业链海外投资总额及增速
"""

from __future__ import annotations

from datetime import datetime

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector
from data_collectors.utils import normalize_country, normalize_enterprise


# ============================================================
# C012 海外投资目的国TOP10
# ============================================================
@register_collector
class C012_InvestDestTop10(BaseCollector):
    chart_id = "C012"
    chart_name = "海外投资目的国TOP10"
    source_name = "荣鼎/商务部/fDi"
    category = "投资"
    freq = "quarterly"
    unit = "亿美元/项目数"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "invest_destination_top10"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "metric": "str"}})

        # 荣鼎(Rhodium)和 fDi Markets 均为付费数据库
        # 这里预留从文章抽取关系的逻辑入口

        # Mock: TOP10 目的国
        countries = ["匈牙利", "印尼", "泰国", "墨西哥", "德国", "美国", "巴西", "波兰", "土耳其", "摩洛哥"]
        points = []
        now = datetime.utcnow()
        for i, c in enumerate(countries):
            points.append({
                "period_date": f"{now.year}-{((now.month-1)//3)*3+1:02d}-01",
                "period_type": "quarter",
                "value": round(50 - i * 4.5, 2),
                "dimension_json": {"country": c, "metric": "投资金额", "rank": i + 1, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据（需配置荣鼎/fDi API 或从文章抽取投资关系）"
        return result


# ============================================================
# C013 海外投资金额TOP10企业
# ============================================================
@register_collector
class C013_InvestEnterpriseTop10(BaseCollector):
    chart_id = "C013"
    chart_name = "海外投资金额TOP10企业"
    source_name = "荣鼎/企业公告"
    category = "投资"
    freq = "quarterly"
    unit = "亿美元"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "invest_enterprise_top10"
        self.ensure_series(series_key, extra={"dimensions": {"enterprise": "str", "metric": "str"}})

        # 建议从平台文章抽取 rel-01投资建厂 / rel-05跨境投融资 关系后聚合

        enterprises = ["宁德时代", "比亚迪", "远景动力", "国轩高科", "亿纬锂能", "蜂巢能源", "中创新航", "华友钴业", "天赐材料", "容百科技"]
        points = []
        now = datetime.utcnow()
        for i, ent in enumerate(enterprises):
            points.append({
                "period_date": f"{now.year}-{((now.month-1)//3)*3+1:02d}-01",
                "period_type": "quarter",
                "value": round(30 - i * 2.5, 2),
                "dimension_json": {"enterprise": ent, "metric": "投资金额", "rank": i + 1, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据（建议从本体关系 rel-01/rel-05 聚合真实投资事件）"
        return result


# ============================================================
# C014 产业链海外投资总额及增速
# ============================================================
@register_collector
class C014_InvestTotalGrowth(BaseCollector):
    chart_id = "C014"
    chart_name = "产业链海外投资总额及增速"
    source_name = "荣鼎/商务部"
    category = "投资"
    freq = "yearly"
    unit = "亿美元/%"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "invest_total_growth"
        self.ensure_series(series_key, extra={"dimensions": {"metric": "str"}})

        # Mock: 年度投资总额及增速
        points = []
        data = [
            (2020, 45.0, 15.2),
            (2021, 78.5, 74.4),
            (2022, 125.0, 59.2),
            (2023, 168.0, 34.4),
            (2024, 210.0, 25.0),
        ]
        for year, total, yoy in data:
            points.append({
                "period_date": f"{year}-12-01",
                "period_type": "year",
                "value": round(total, 2),
                "value_yoy": round(yoy, 2),
                "dimension_json": {"metric": "投资总额", "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟年度数据（需配置荣鼎/商务部数据源）"
        return result
