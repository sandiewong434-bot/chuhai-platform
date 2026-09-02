# -*- coding: utf-8 -*-
"""
技术合作数据 collectors
========================
C015 主要中外技术合作项目一览
C016 技术合作海外区域分布
C017 技术授权协议数量及增长
"""

from __future__ import annotations

from datetime import datetime

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector


# ============================================================
# C015 主要中外技术合作项目一览
# ============================================================
@register_collector
class C015_TechCoopProjects(BaseCollector):
    chart_id = "C015"
    chart_name = "主要中外技术合作项目一览"
    source_name = "企业公告/新闻"
    category = "技术"
    freq = "monthly"
    unit = "项目数"
    is_paid_source = False  # 可从平台文章抽取

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "tech_coop_projects"
        self.ensure_series(series_key, extra={"dimensions": {"enterprise_cn": "str", "enterprise_foreign": "str", "coop_type": "str"}})

        # 建议从平台文章中抽取 rel-02出海经营(技术授权) 及自定义技术合作关系
        # 典型项目如：大众×小鹏、Stellantis×零跑、雷诺×吉利 等

        # Mock: 近期重大技术合作项目
        projects = [
            {"cn": "小鹏", "foreign": "大众", "type": "平台合作"},
            {"cn": "零跑", "foreign": "Stellantis", "type": "股权+技术"},
            {"cn": "吉利", "foreign": "雷诺", "type": "动力总成合资"},
            {"cn": "比亚迪", "foreign": "丰田", "type": "电池供应"},
            {"cn": "宁德时代", "foreign": "福特", "type": "技术授权"},
            {"cn": "蔚来", "foreign": "阿布扎比CYVN", "type": "战略投资"},
        ]
        points = []
        now = datetime.utcnow()
        for p in projects:
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": 1,
                "dimension_json": {
                    "enterprise_cn": p["cn"],
                    "enterprise_foreign": p["foreign"],
                    "coop_type": p["type"],
                    "_mock": True,
                },
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟项目数据（建议从本体关系抽取真实技术合作事件）"
        return result


# ============================================================
# C016 技术合作海外区域分布
# ============================================================
@register_collector
class C016_TechCoopRegionDist(BaseCollector):
    chart_id = "C016"
    chart_name = "技术合作海外区域分布"
    source_name = "人工研编/新闻聚合"
    category = "技术"
    freq = "quarterly"
    unit = "项目数"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "tech_coop_region_dist"
        self.ensure_series(series_key, extra={"dimensions": {"region": "str"}})

        # Mock: 按区域聚合
        regions = ["欧洲", "东南亚", "中东", "北美", "南美", "非洲", "大洋洲"]
        points = []
        now = datetime.utcnow()
        for r in regions:
            points.append({
                "period_date": f"{now.year}-{((now.month-1)//3)*3+1:02d}-01",
                "period_type": "quarter",
                "value": round(12 - hash(r) % 10, 2),
                "dimension_json": {"region": r, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟区域分布数据"
        return result


# ============================================================
# C017 技术授权协议数量及增长
# ============================================================
@register_collector
class C017_TechLicenseCount(BaseCollector):
    chart_id = "C017"
    chart_name = "技术授权协议数量及增长"
    source_name = "人工研编/行业报告"
    category = "技术"
    freq = "yearly"
    unit = "项/%"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "tech_license_count"
        self.ensure_series(series_key, extra={"dimensions": {"metric": "str"}})

        # Mock: 年度技术授权协议数量
        points = []
        data = [
            (2020, 8, None),
            (2021, 12, 50.0),
            (2022, 18, 50.0),
            (2023, 28, 55.6),
            (2024, 35, 25.0),
        ]
        for year, count, yoy in data:
            points.append({
                "period_date": f"{year}-12-01",
                "period_type": "year",
                "value": count,
                "value_yoy": yoy,
                "dimension_json": {"metric": "技术授权协议数", "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟年度数据"
        return result
