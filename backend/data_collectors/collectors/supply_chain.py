# -*- coding: utf-8 -*-
"""
产业链数据 collectors
=====================
C001 锂盐产能与产量
C002 锂盐价格走势
C006 动力电池产能及利用率
C007 动力电池企业装车量排名及份额
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector
from data_collectors.utils import http_get, http_post, normalize_enterprise, parse_date


# ============================================================
# C001 锂盐产能与产量
# ============================================================
@register_collector
class C001_LithiumCapacity(BaseCollector):
    chart_id = "C001"
    chart_name = "锂盐产能与产量"
    source_name = "SMM/百川盈孚"
    category = "产业链"
    freq = "monthly"
    unit = "万吨"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "lithium_capacity_production"
        self.ensure_series(series_key, extra={"dimensions": {"product": "str", "metric": "str"}})

        # 检查是否有 API Key
        smm_api_key = os.environ.get("SMM_API_KEY", "")
        bc_api_key = os.environ.get("BAICHUAN_API_KEY", "")

        if not smm_api_key and not bc_api_key:
            result.message = "未配置 SMM/百川盈孚 API Key，使用模拟数据"
            points = self.fallback_mock_data(series_key, months=24)
            # 给 mock 数据加上维度
            for p in points:
                p["dimension_json"] = {"product": "碳酸锂", "metric": "产量", "_mock": True}
            inserted, updated = self.upsert_indicator_points(series_key, points)
            result.records_inserted = inserted
            result.records_updated = updated
            result.success = True
            return result

        # TODO: 接入真实 API
        result.message = "API Key 已配置，但真实接入逻辑待实现"
        result.success = True
        return result


# ============================================================
# C002 锂盐价格走势
# ============================================================
@register_collector
class C002_LithiumPrice(BaseCollector):
    chart_id = "C002"
    chart_name = "锂盐价格走势"
    source_name = "SMM/生意社"
    category = "产业链"
    freq = "daily"
    unit = "元/吨"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "lithium_price"
        self.ensure_series(series_key, extra={"dimensions": {"product": "str", "grade": "str"}})

        # 尝试从生意社公开页面抓取（免费）
        try:
            url = "https://www.100ppi.com/graph/index/graph---1-2024-1-2024-12.html"
            # 生意社锂价格页面是动态加载的，实际抓取需要解析其数据接口
            # 这里预留框架
            result.message = "生意社页面需 JS 渲染，建议接入其 API 或 Selenium"
            result.success = True
            return result
        except Exception as e:
            result.errors.append(str(e))

        # Fallback to mock
        points = self.fallback_mock_data(series_key, months=12)
        for p in points:
            p["dimension_json"] = {"product": "电池级碳酸锂", "grade": "99.5%", "_mock": True}
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据（需配置付费 API）"
        return result


# ============================================================
# C006 动力电池产能及利用率
# ============================================================
@register_collector
class C006_BatteryCapacity(BaseCollector):
    chart_id = "C006"
    chart_name = "动力电池产能及利用率"
    source_name = "高工GGII/SNE"
    category = "产业链"
    freq = "quarterly"
    unit = "GWh/%"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "battery_capacity_utilization"
        self.ensure_series(series_key, extra={"dimensions": {"enterprise": "str", "metric": "str"}})

        # 尝试从中国汽车动力电池产业创新联盟公开数据抓取
        try:
            url = "https://www.cbea.com/site/list/7.html"
            resp = http_get(url, timeout=15)
            result.message = f"动力电池联盟页面响应 {resp.status_code}，需进一步解析"
            # 实际解析逻辑较复杂，需针对页面结构定制
            result.success = True
            return result
        except Exception as e:
            result.errors.append(f"抓取失败: {e}")

        # Fallback
        points = self.fallback_mock_data(series_key, months=8)
        for p in points:
            p["dimension_json"] = {"enterprise": "行业平均", "metric": "产能利用率", "_mock": True}
            p["period_type"] = "quarter"
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据"
        return result


# ============================================================
# C007 动力电池企业装车量排名及份额
# ============================================================
@register_collector
class C007_BatteryInstallRank(BaseCollector):
    chart_id = "C007"
    chart_name = "动力电池企业装车量排名及份额"
    source_name = "SNE/动力电池联盟"
    category = "产业链"
    freq = "monthly"
    unit = "GWh/%"
    is_paid_source = False  # 部分公开

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "battery_install_rank"
        self.ensure_series(series_key, extra={"dimensions": {"enterprise": "str", "rank": "int"}})

        # 中国汽车动力电池产业创新联盟月度数据
        try:
            url = "https://www.cbea.com/"
            resp = http_get(url, timeout=15)
            # 实际数据在子页面，需要进一步抓取
            result.message = "已抓取动力电池联盟首页，需深入子页面解析排名数据"
            result.success = True
            return result
        except Exception as e:
            result.errors.append(str(e))

        # Mock 数据：TOP5 企业
        enterprises = ["宁德时代", "比亚迪", "中创新航", "亿纬锂能", "国轩高科"]
        points = []
        now = datetime.utcnow()
        for i, ent in enumerate(enterprises):
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": round(15 - i * 2.5, 2),
                "dimension_json": {"enterprise": ent, "rank": i + 1, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟排名数据（建议接入 SNE/CBEA 真实数据源）"
        return result
