# -*- coding: utf-8 -*-
"""
销量与出口数据 collectors
==========================
C003  车企销量排名及份额(全球/中国)
C005  新能源销量(全球→中国分车型)
C008  新能源出口占比提升趋势
C009  新能源出口总量前五地区
C010  整车出口量TOP10品牌
C011  整车出口总量及全球排名
C018  全球销量TOP15国家及中国品牌市占率
"""

from __future__ import annotations

import json
import re
from datetime import datetime

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector
from data_collectors.utils import http_get, normalize_enterprise, normalize_country, parse_date


# ============================================================
# C003 车企销量排名及份额
# ============================================================
@register_collector
class C003_AutoSalesRank(BaseCollector):
    chart_id = "C003"
    chart_name = "车企销量排名及份额"
    source_name = "中汽协/乘联会"
    category = "贸易"
    freq = "monthly"
    unit = "万辆/%"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "auto_sales_rank"
        self.ensure_series(series_key, extra={"dimensions": {"enterprise": "str", "scope": "str"}})

        # 乘联会公开月度销量数据
        try:
            # 乘联会官网部分数据公开
            url = "https://www.cpcaauto.com/newslist.php?types=1"
            resp = http_get(url, timeout=15)
            result.message = f"乘联会页面响应 {resp.status_code}，销量数据需从报告 PDF 中提取"
            result.success = True
            return result
        except Exception as e:
            result.errors.append(str(e))

        # 中汽协数据接口（部分公开）
        try:
            # 中汽协统计信息网
            url = "http://www.caam.org.cn/"
            resp = http_get(url, timeout=15)
            result.message += " | 中汽协首页已抓取"
        except Exception as e:
            result.errors.append(str(e))

        # Mock
        enterprises = ["比亚迪", "吉利", "一汽", "长安", "奇瑞"]
        points = []
        now = datetime.utcnow()
        for i, ent in enumerate(enterprises):
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": round(25 - i * 3, 2),
                "dimension_json": {"enterprise": ent, "scope": "中国", "rank": i + 1, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = result.message or "使用模拟数据"
        return result


# ============================================================
# C005 新能源销量(全球→中国分车型)
# ============================================================
@register_collector
class C005_NEVSalesByModel(BaseCollector):
    chart_id = "C005"
    chart_name = "新能源销量(全球→中国分车型)"
    source_name = "中汽协/EV-Volumes"
    category = "贸易"
    freq = "monthly"
    unit = "万辆"
    is_paid_source = False  # 中汽协部分公开

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "nev_sales_by_model"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "model_type": "str"}})

        try:
            # 中汽协月度数据
            url = "https://www.caam.org.cn/"
            resp = http_get(url, timeout=15)
            result.message = "中汽协页面需进一步解析具体车型数据"
        except Exception as e:
            result.errors.append(str(e))

        # Mock: 分车型
        model_types = ["纯电轿车", "纯电SUV", "插混", "增程"]
        points = []
        now = datetime.utcnow()
        for mt in model_types:
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": round(8 + hash(mt) % 15, 2),
                "dimension_json": {"country": "中国", "model_type": mt, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = result.message or "使用模拟分车型数据"
        return result


# ============================================================
# C008 新能源出口占比提升趋势
# ============================================================
@register_collector
class C008_NEVExportRatio(BaseCollector):
    chart_id = "C008"
    chart_name = "新能源出口占比提升趋势"
    source_name = "海关总署/中汽协"
    category = "贸易"
    freq = "monthly"
    unit = "%"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "nev_export_ratio"
        self.ensure_series(series_key, extra={"dimensions": {"product": "str"}})

        # 海关总署统计数据
        try:
            # 海关总署统计月报
            url = "http://www.customs.gov.cn/customs/302249/zfxxgk/2799825/302274/302275/index.html"
            resp = http_get(url, timeout=20)
            result.message = f"海关月报页面响应 {resp.status_code}，需解析 PDF 或表格"
            result.success = True
            return result
        except Exception as e:
            result.errors.append(str(e))

        # Mock: 出口占比逐年提升
        points = []
        for year in range(2020, 2025):
            ratio = 2.5 + (year - 2020) * 3.2
            points.append({
                "period_date": f"{year}-12-01",
                "period_type": "year",
                "value": round(ratio, 2),
                "dimension_json": {"product": "新能源汽车", "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟年度数据（建议接入海关统计数据接口）"
        return result


# ============================================================
# C009 新能源出口总量前五地区
# ============================================================
@register_collector
class C009_NEVExportTopRegions(BaseCollector):
    chart_id = "C009"
    chart_name = "新能源出口总量前五地区"
    source_name = "海关总署"
    category = "贸易"
    freq = "monthly"
    unit = "万辆"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "nev_export_top_regions"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "rank": "int"}})

        # Mock: TOP5 目的地
        countries = ["比利时", "泰国", "英国", "菲律宾", "澳大利亚"]
        points = []
        now = datetime.utcnow()
        for i, c in enumerate(countries):
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": round(3.5 - i * 0.5, 2),
                "dimension_json": {"country": c, "rank": i + 1, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据（建议接入海关统计）"
        return result


# ============================================================
# C010 整车出口量TOP10品牌
# ============================================================
@register_collector
class C010_VehicleExportTopBrands(BaseCollector):
    chart_id = "C010"
    chart_name = "整车出口量TOP10品牌"
    source_name = "中汽协/海关"
    category = "贸易"
    freq = "monthly"
    unit = "万辆"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "vehicle_export_top_brands"
        self.ensure_series(series_key, extra={"dimensions": {"enterprise": "str", "rank": "int"}})

        brands = ["奇瑞", "上汽", "长安", "比亚迪", "长城", "吉利", "北汽", "特斯拉", "江淮", "东风"]
        points = []
        now = datetime.utcnow()
        for i, b in enumerate(brands):
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": round(5.0 - i * 0.4, 2),
                "dimension_json": {"enterprise": b, "rank": i + 1, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据"
        return result


# ============================================================
# C011 整车出口总量及全球排名
# ============================================================
@register_collector
class C011_VehicleExportTotalRank(BaseCollector):
    chart_id = "C011"
    chart_name = "整车出口总量及全球排名"
    source_name = "海关总署/OICA"
    category = "贸易"
    freq = "yearly"
    unit = "万辆"
    is_paid_source = False

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "vehicle_export_total_rank"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str"}})

        # OICA 世界汽车组织数据（部分公开）
        try:
            url = "https://www.oica.net/"
            resp = http_get(url, timeout=15)
            result.message = f"OICA 页面响应 {resp.status_code}，需解析其年度统计报告"
        except Exception as e:
            result.errors.append(str(e))

        # Mock: 中国整车出口总量及全球排名
        points = []
        for year in range(2020, 2025):
            export = 100 + (year - 2020) * 130  # 从 ~100万 到 ~600万
            points.append({
                "period_date": f"{year}-12-01",
                "period_type": "year",
                "value": round(export, 2),
                "dimension_json": {"country": "中国", "global_rank": 1 if year >= 2023 else 2, "_mock": True},
                "confidence": "low",
            })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = result.message or "使用模拟年度数据"
        return result


# ============================================================
# C018 全球销量TOP15国家及中国品牌市占率
# ============================================================
@register_collector
class C018_GlobalSalesChinaShare(BaseCollector):
    chart_id = "C018"
    chart_name = "全球销量TOP15国家及中国品牌市占率"
    source_name = "EV-Volumes/彭博NEF"
    category = "贸易"
    freq = "monthly"
    unit = "万辆/%"
    is_paid_source = True

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "global_sales_china_share"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "metric": "str"}})

        # Mock: TOP15 国家销量 + 中国品牌市占率
        countries = ["中国", "美国", "德国", "英国", "法国", "日本", "韩国", "挪威", "瑞典", "荷兰", "意大利", "加拿大", "澳大利亚", "西班牙", "巴西"]
        points = []
        now = datetime.utcnow()
        for c in countries:
            base = 80 if c == "中国" else (15 if c in ["美国", "德国"] else 5)
            points.append({
                "period_date": f"{now.year}-{now.month:02d}-01",
                "period_type": "month",
                "value": round(base + hash(c) % 20, 2),
                "dimension_json": {"country": c, "metric": "销量", "_mock": True},
                "confidence": "low",
            })
            if c != "中国":
                points.append({
                    "period_date": f"{now.year}-{now.month:02d}-01",
                    "period_type": "month",
                    "value": round(5 + hash(c) % 15, 2),
                    "dimension_json": {"country": c, "metric": "中国品牌市占率", "_mock": True},
                    "confidence": "low",
                })
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        result.message = "使用模拟数据（需配置 EV-Volumes/彭博 API）"
        return result
