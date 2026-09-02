# -*- coding: utf-8 -*-
"""
基础设施与渗透率数据 collectors
=================================
C004 充电桩保有量及增量
C019 千人保有量vs渗透率散点图
"""

from __future__ import annotations

from datetime import datetime

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector
from data_collectors.utils import http_get, normalize_country


# ============================================================
# C004 充电桩保有量及增量
# ============================================================
@register_collector
class C004_ChargingPileStock(BaseCollector):
    chart_id = "C004"
    chart_name = "充电桩保有量及增量"
    source_name = "中国充电联盟/IEA"
    category = "基础设施"
    freq = "monthly"
    unit = "万台"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "charging_pile_stock"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "pile_type": "str", "metric": "str"}})

        # 中国充电联盟公开月度数据
        try:
            # 联盟官网
            url = "https://www.evcipa.org.cn/"
            resp = http_get(url, timeout=15)
            result.message = f"充电联盟页面响应 {resp.status_code}，需解析其统计月报"
        except Exception as e:
            result.errors.append(str(e))

        # IEA Global EV Outlook 公开数据
        try:
            url = "https://www.iea.org/data-and-statistics/data-tools/global-ev-data-explorer"
            resp = http_get(url, timeout=15)
            result.message = (result.message or "") + f" | IEA 数据页面响应 {resp.status_code}"
        except Exception as e:
            result.errors.append(str(e))

        # Mock: 中国充电桩保有量
        points = []
        for year in range(2020, 2025):
            stock = 150 + (year - 2020) * 180  # 从 ~150万 到 ~870万
            points.append({
                "period_date": f"{year}-12-01",
                "period_type": "year",
                "value": round(stock, 2),
                "dimension_json": {"country": "中国", "pile_type": "公共+私人", "metric": "保有量", "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = result.message or "使用模拟年度数据（建议接入充电联盟/IEA 真实接口）"
        return result


# ============================================================
# C019 千人保有量vs渗透率散点图
# ============================================================
@register_collector
class C019_PenetrationScatter(BaseCollector):
    chart_id = "C019"
    chart_name = "千人保有量vs渗透率散点图"
    source_name = "OICA/世界银行/IEA"
    category = "基础设施"
    freq = "yearly"
    unit = "辆/千人, %"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "penetration_scatter"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str"}})

        # OICA / World Bank / IEA 均为公开数据源，可尝试 API
        # World Bank API: https://api.worldbank.org/v2/country/all/indicator/IS.VEH.NVEH.P3?
        try:
            wb_url = "https://api.worldbank.org/v2/country/CHN/indicator/IS.VEH.NVEH.P3?format=json&per_page=10"
            resp = http_get(wb_url, timeout=15)
            data = resp.json()
            result.message = f"世界银行 API 响应成功，数据条目: {len(data[1]) if len(data) > 1 else 0}"
        except Exception as e:
            result.errors.append(f"世界银行 API: {e}")

        # Mock: 主要国家散点数据（千人保有量, 渗透率）
        scatter_data = [
            ("挪威", 620, 85.0),
            ("中国", 180, 35.0),
            ("美国", 340, 12.0),
            ("德国", 280, 25.0),
            ("英国", 220, 22.0),
            ("法国", 200, 20.0),
            ("日本", 150, 3.0),
            ("韩国", 110, 8.0),
            ("泰国", 25, 5.0),
            ("印尼", 8, 2.0),
            ("印度", 5, 1.5),
            ("巴西", 15, 3.0),
            ("墨西哥", 18, 4.0),
            ("澳大利亚", 280, 10.0),
            ("加拿大", 260, 8.0),
        ]
        points = []
        now = datetime.utcnow()
        for country, per_1000, penetration in scatter_data:
            points.append({
                "period_date": f"{now.year}-12-01",
                "period_type": "year",
                "value": per_1000,
                "dimension_json": {
                    "country": country,
                    "per_1000": per_1000,
                    "penetration_pct": penetration,
                    "_mock": True,
                },
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = result.message or "使用模拟数据（建议接入世界银行/IEA API 获取真实数据）"
        return result
