# -*- coding: utf-8 -*-
"""
基础设施与渗透率数据 collectors
=================================
C004 充电桩保有量及增量
C019 千人保有量vs渗透率散点图
"""

from __future__ import annotations

import os
from datetime import datetime

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector
from data_collectors.utils import http_get, normalize_country


# ============================================================
# C004 充电桩保有量及增量
# ============================================================
@register_collector
class C004_ChargingPileStock(BaseCollector):
    """
    充电桩保有量及增量采集器
    ==========================
    信源优先级:
        1. 中国充电联盟 API (付费)
        2. IEA Global EV Outlook API
        3. 中国充电联盟公开月度统计数据
        4. IEA 公开数据页面
        5. 基于真实充电联盟数据的降级模拟
    """
    chart_id = "C004"
    chart_name = "充电桩保有量及增量"
    source_name = "中国充电联盟/IEA"
    category = "基础设施"
    freq = "monthly"
    unit = "万台/座"
    is_paid_source = False

    # 真实充电联盟数据（中国充电桩保有量，万台）
    # 数据来源: 中国充电联盟(EVCIPA)月度统计数据
    # 年度基准（年底数据）
    ANNUAL_BENCHMARK = {
        2020: {"public": 80.7, "private": 87.4, "station": 0.06},   # 年底
        2021: {"public": 114.7, "private": 147.0, "station": 0.13},
        2022: {"public": 179.7, "private": 341.2, "station": 0.20},
        2023: {"public": 272.6, "private": 587.0, "station": 0.36},
        2024: {"public": 346.0, "private": 750.0, "station": 0.50},  # 预估
        2025: {"public": 420.0, "private": 900.0, "station": 0.80},  # 预估
        2026: {"public": 500.0, "private": 1100.0, "station": 1.20}, # 预估
    }

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "charging_pile_stock"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "pile_type": "str", "metric": "str", "source": "str"}})

        points = []
        messages = []

        # ===== 优先级 1: 中国充电联盟 API =====
        evcipa_points, evcipa_msg = self._fetch_evcipa_api()
        if evcipa_points:
            points.extend(evcipa_points)
            messages.append(evcipa_msg)

        # ===== 优先级 2: IEA API =====
        iea_points, iea_msg = self._fetch_iea_api()
        if iea_points:
            points.extend(iea_points)
            messages.append(iea_msg)

        # ===== 优先级 3: 中国充电联盟公开月度统计 =====
        evcipa_page_points, evcipa_page_msg = self._fetch_evcipa_page()
        if evcipa_page_points:
            points.extend(evcipa_page_points)
            messages.append(evcipa_page_msg)

        # ===== 优先级 4: IEA 公开数据页面 =====
        iea_page_points, iea_page_msg = self._fetch_iea_page()
        if iea_page_points:
            points.extend(iea_page_points)
            messages.append(iea_page_msg)

        # ===== 降级: 基于真实充电联盟数据的模拟数据 =====
        if not points:
            result.message = "所有信源均不可用，使用基于中国充电联盟真实数据的模拟数据"
            points = self._generate_realistic_charging_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        points = self._dedup_points(points)
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result

    def _fetch_evcipa_api(self) -> tuple[list[dict], str]:
        api_key = os.environ.get("EVCIPA_API_KEY", "")
        if not api_key:
            return [], "未配置 EVCIPA_API_KEY"
        return [], "API Key 已配置，待接入"

    def _fetch_iea_api(self) -> tuple[list[dict], str]:
        api_key = os.environ.get("IEA_API_KEY", "")
        if not api_key:
            return [], "未配置 IEA_API_KEY"
        return [], "API Key 已配置，待接入"

    def _fetch_evcipa_page(self) -> tuple[list[dict], str]:
        try:
            url = "https://www.evcipa.org.cn/"
            resp = http_get(url, timeout=15, max_retries=2)
            return [], f"充电联盟首页已访问 (HTTP {resp.status_code})，月度数据需进一步解析"
        except Exception as e:
            return [], f"充电联盟抓取失败: {e}"

    def _fetch_iea_page(self) -> tuple[list[dict], str]:
        try:
            url = "https://www.iea.org/data-and-statistics/data-tools/global-ev-data-explorer"
            resp = http_get(url, timeout=15, max_retries=2)
            return [], f"IEA 数据页面已访问 (HTTP {resp.status_code})"
        except Exception as e:
            return [], f"IEA 抓取失败: {e}"

    def _generate_realistic_charging_data(self) -> list[dict]:
        """基于真实充电联盟数据的月度模拟数据"""
        points = []
        years = sorted(self.ANNUAL_BENCHMARK.keys())

        for i, year in enumerate(years):
            annual = self.ANNUAL_BENCHMARK[year]
            prev_annual = self.ANNUAL_BENCHMARK.get(years[i - 1]) if i > 0 else None

            for month in range(1, 13):
                period_date = f"{year}-{month:02d}-01"

                # 插值计算月度保有量（线性增长假设）
                if prev_annual:
                    progress = month / 12.0
                    public = round(prev_annual["public"] + (annual["public"] - prev_annual["public"]) * progress, 2)
                    private = round(prev_annual["private"] + (annual["private"] - prev_annual["private"]) * progress, 2)
                    station = round(prev_annual["station"] + (annual["station"] - prev_annual["station"]) * progress, 2)
                else:
                    # 第一年，从0开始增长
                    progress = month / 12.0
                    public = round(annual["public"] * progress, 2)
                    private = round(annual["private"] * progress, 2)
                    station = round(annual["station"] * progress, 2)

                # 公共桩保有量
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": public,
                    "dimension_json": {
                        "country": "中国",
                        "pile_type": "公共桩",
                        "metric": "保有量",
                        "unit": "万台",
                        "source": "中国充电联盟行业基准",
                        "_mock": True,
                    },
                    "confidence": "medium",
                })
                # 私人桩保有量
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": private,
                    "dimension_json": {
                        "country": "中国",
                        "pile_type": "私人桩",
                        "metric": "保有量",
                        "unit": "万台",
                        "source": "中国充电联盟行业基准",
                        "_mock": True,
                    },
                    "confidence": "medium",
                })
                # 换电站数量
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": station,
                    "dimension_json": {
                        "country": "中国",
                        "pile_type": "换电站",
                        "metric": "保有量",
                        "unit": "万座",
                        "source": "中国充电联盟行业基准",
                        "_mock": True,
                    },
                    "confidence": "medium",
                })
                # 合计
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": round(public + private, 2),
                    "dimension_json": {
                        "country": "中国",
                        "pile_type": "合计",
                        "metric": "保有量",
                        "unit": "万台",
                        "source": "中国充电联盟行业基准",
                        "_mock": True,
                    },
                    "confidence": "medium",
                })
        return points

    @staticmethod
    def _dedup_points(points: list[dict]) -> list[dict]:
        seen = {}
        for p in points:
            dim = p.get("dimension_json") or {}
            key = f"{p['period_date']}:{dim.get('pile_type', 'unknown')}:{dim.get('metric', 'unknown')}"
            existing = seen.get(key)
            if existing is None:
                seen[key] = p
            elif dim.get("_mock") and not existing.get("dimension_json", {}).get("_mock"):
                pass
            elif not dim.get("_mock") and existing.get("dimension_json", {}).get("_mock"):
                seen[key] = p
            elif p.get("confidence") == "high":
                seen[key] = p
        return list(seen.values())


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
