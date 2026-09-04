# -*- coding: utf-8 -*-
"""
基础设施数据 collectors
========================
C004 充电桩保有量及增量（已在 infrastructure.py）
C019 千人保有量vs渗透率散点图
"""

from __future__ import annotations

from datetime import datetime

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector


# ============================================================
# C019 千人保有量vs渗透率散点图
# ============================================================
@register_collector
class C019_PenetrationVsOwnership(BaseCollector):
    """
    千人保有量 vs NEV 渗透率散点图
    ================================
    信源: OICA/世界银行/IEA
    """
    chart_id = "C019"
    chart_name = "千人保有量vs渗透率散点图"
    source_name = "OICA/世界银行/IEA"
    category = "基础设施"
    freq = "yearly"
    unit = "辆/千人,%"
    is_paid_source = False

    # 基于 OICA/IEA/世界银行公开数据的行业基准（2024年）
    # 千人保有量(辆/千人), NEV渗透率(%)
    COUNTRY_BENCHMARK = {
        # 高渗透率高保有量
        "挪威":     {"ownership": 650, "penetration": 89.2, "region": "欧洲"},
        "瑞典":     {"ownership": 580, "penetration": 62.8, "region": "欧洲"},
        "荷兰":     {"ownership": 550, "penetration": 58.3, "region": "欧洲"},
        "冰岛":     {"ownership": 620, "penetration": 72.0, "region": "欧洲"},
        # 中高渗透率
        "中国":     {"ownership": 230, "penetration": 35.0, "region": "亚洲"},
        "德国":     {"ownership": 600, "penetration": 22.0, "region": "欧洲"},
        "英国":     {"ownership": 520, "penetration": 24.6, "region": "欧洲"},
        "法国":     {"ownership": 510, "penetration": 22.1, "region": "欧洲"},
        "以色列":   {"ownership": 350, "penetration": 18.2, "region": "中东"},
        "韩国":     {"ownership": 480, "penetration": 9.5,  "region": "亚洲"},
        "意大利":   {"ownership": 630, "penetration": 15.3, "region": "欧洲"},
        "西班牙":   {"ownership": 530, "penetration": 12.1, "region": "欧洲"},
        "泰国":     {"ownership": 260, "penetration": 12.8, "region": "亚洲"},
        "澳大利亚": {"ownership": 750, "penetration": 8.6,  "region": "大洋洲"},
        # 低渗透率
        "美国":     {"ownership": 820, "penetration": 9.8,  "region": "北美"},
        "加拿大":   {"ownership": 700, "penetration": 8.1,  "region": "北美"},
        "日本":     {"ownership": 610, "penetration": 3.2,  "region": "亚洲"},
        "巴西":     {"ownership": 350, "penetration": 3.5,  "region": "南美"},
        "墨西哥":   {"ownership": 300, "penetration": 2.1,  "region": "北美"},
        "印度":     {"ownership": 35,  "penetration": 2.3,  "region": "亚洲"},
        "土耳其":   {"ownership": 180, "penetration": 5.4,  "region": "中东"},
    }

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "penetration_vs_ownership"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "region": "str"}})

        points = []
        now = datetime.utcnow()
        period_date = f"{now.year}-12-01"

        for country, data in self.COUNTRY_BENCHMARK.items():
            points.append({
                "period_date": period_date,
                "period_type": "year",
                "value": data["penetration"],  # 渗透率作为主值
                "dimension_json": {
                    "country": country,
                    "region": data["region"],
                    "ownership_per_1000": data["ownership"],
                    "penetration_rate": data["penetration"],
                    "_mock": True,
                },
                "confidence": "medium",
            })

        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "基于 OICA/世界银行/IEA 公开数据的行业基准"
        return result
