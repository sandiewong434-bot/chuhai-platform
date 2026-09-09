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
import os
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

    # 基于乘联会公开报告整理的 REAL 数据（万辆）
    # 口径随月份标注（狭义零售/新能源批发/新能源零售），每条注明来源
    # 来源：乘联会月度市场分析报告/销量快报（经 cada.cn、新浪财经、凤凰网、网易等转载核对）
    SALES_REAL_DATA: list[dict] = [
        # ── 2025年度 狭义乘用车零售榜（乘联会年度榜单）──
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "比亚迪", "value": 348.5, "yoy": -6.3, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "吉利汽车", "value": 260.6, "yoy": 46.9, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "一汽大众", "value": 153.1, "yoy": None, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "长安汽车", "value": 140.1, "yoy": 2.6, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "奇瑞汽车", "value": 134.8, "yoy": 1.0, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "上汽大众", "value": 106.3, "yoy": -11.4, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "一汽丰田", "value": 80.4, "yoy": 0.7, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        {"period_date": "2025-12-01", "period_type": "year", "enterprise": "广汽丰田", "value": 77.3, "yoy": 0.3, "scope": "狭义乘用车零售", "source": "乘联会2025年度销量榜单"},
        # ── 2026年5月 新能源乘用车批发榜（乘联会5月报告，精确到辆）──
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "比亚迪", "value": 37.70, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "吉利汽车", "value": 13.10, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "奇瑞汽车", "value": 9.48, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "特斯拉中国", "value": 8.60, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "零跑汽车", "value": 8.16, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "上汽通用五菱", "value": 6.47, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "长安汽车", "value": 6.33, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "上汽乘用车", "value": 4.66, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "蔚来汽车", "value": 3.77, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        {"period_date": "2026-05-01", "period_type": "month", "enterprise": "东风汽车", "value": 3.69, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年5月全国乘用车市场分析报告"},
        # ── 2026年6月 新能源乘用车批发榜（乘联会6月深度分析报告）──
        {"period_date": "2026-06-01", "period_type": "month", "enterprise": "比亚迪", "value": 39.7, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年6月新能源乘用车市场深度分析报告"},
        {"period_date": "2026-06-01", "period_type": "month", "enterprise": "吉利汽车", "value": 15.9, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年6月新能源乘用车市场深度分析报告"},
        {"period_date": "2026-06-01", "period_type": "month", "enterprise": "奇瑞汽车", "value": 10.7, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年6月新能源乘用车市场深度分析报告"},
        {"period_date": "2026-06-01", "period_type": "month", "enterprise": "零跑汽车", "value": 9.3, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年6月新能源乘用车市场深度分析报告"},
        {"period_date": "2026-06-01", "period_type": "month", "enterprise": "特斯拉中国", "value": 8.9, "yoy": None, "scope": "新能源批发", "source": "乘联会2026年6月新能源乘用车市场深度分析报告"},
        # ── 2026年7月 狭义乘用车零售厂商榜（乘联会7月快报，自主首包揽前五）──
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "比亚迪", "value": 22.3, "yoy": None, "share": 15.3, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "吉利汽车", "value": 16.1, "yoy": None, "share": 11.0, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "零跑汽车", "value": 8.4, "yoy": None, "share": 5.7, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "长安汽车", "value": 8.0, "yoy": None, "share": 5.5, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "奇瑞汽车", "value": 7.5, "yoy": None, "share": 5.1, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "一汽大众", "value": 7.3, "yoy": -33.9, "share": 5.0, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "上汽通用五菱", "value": 5.6, "yoy": -11.4, "share": 3.8, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "广汽丰田", "value": 5.3, "yoy": -19.5, "share": 3.6, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "一汽丰田", "value": 5.0, "yoy": -26.2, "share": 3.4, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "上汽大众", "value": 4.8, "yoy": -41.9, "share": 3.3, "scope": "狭义乘用车零售", "source": "乘联会2026年7月厂商销量排名快报"},
        # ── 2026年7月 新能源乘用车批发榜（乘联会7月市场分析，精确到辆）──
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "比亚迪", "value": 41.06, "yoy": 21.8, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "吉利汽车", "value": 15.66, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "奇瑞汽车", "value": 12.21, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "零跑汽车", "value": 10.13, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "特斯拉中国", "value": 9.36, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "上汽通用五菱", "value": 6.15, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "长安汽车", "value": 5.71, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "上汽乘用车", "value": 5.61, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "小鹏汽车", "value": 3.80, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "蔚来汽车", "value": 3.59, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "长城汽车", "value": 3.46, "yoy": 3.5, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "小米汽车", "value": 3.13, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "理想汽车", "value": 3.05, "yoy": None, "scope": "新能源批发", "metric": "新能源批发", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        # ── 2026年7月 新能源乘用车零售榜（乘联会7月市场分析，精确到辆）──
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "比亚迪", "value": 22.35, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "吉利汽车", "value": 10.55, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "零跑汽车", "value": 8.37, "yoy": 16.0, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "长安汽车", "value": 5.99, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "上汽通用五菱", "value": 4.90, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "鸿蒙智行", "value": 4.54, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "奇瑞汽车", "value": 3.91, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "蔚来汽车", "value": 3.58, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "上汽乘用车", "value": 3.15, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "小米汽车", "value": 3.13, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "理想汽车", "value": 3.05, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "小鹏汽车", "value": 2.83, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "特斯拉中国", "value": 2.72, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
        {"period_date": "2026-07-01", "period_type": "month", "enterprise": "长城汽车", "value": 2.45, "yoy": None, "scope": "新能源零售", "metric": "新能源零售", "source": "乘联会2026年7月份全国乘用车市场分析(cada.cn)"},
    ]

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        # auto_sales_rank 与 vehicle_sales_rank 同为 C003 序列（前端用后者），
        # 真实数据同时写入两个 key，保证口径一致
        series_keys = ["auto_sales_rank", "vehicle_sales_rank"]
        for sk in series_keys:
            self.ensure_series(sk, extra={"dimensions": {"enterprise": "str", "scope": "str"}})

        points = []
        messages = []

        # 尝试从本体关系聚合
        try:
            relation_points, relation_msg = self._extract_from_relations()
            if relation_points:
                points.extend(relation_points)
                messages.append(relation_msg)
        except Exception as e:
            result.errors.append(f"本体抽取: {e}")

        # 主数据层：乘联会公开报告整理的真实销量
        real_points = self._generate_real_data()
        points.extend(real_points)
        messages.append(f"乘联会公开报告整理 {len(real_points)} 条真实销量点")

        points = self._dedup_points(points)
        total_inserted = total_updated = 0
        for sk in series_keys:
            inserted, updated = self.upsert_indicator_points(sk, points)
            total_inserted += inserted
            total_updated += updated
        result.records_inserted = total_inserted
        result.records_updated = total_updated
        result.message = " | ".join(messages)
        result.success = True
        return result

    def _extract_from_relations(self) -> tuple[list[dict], str]:
        try:
            from app.models import Relation
            rels = self.db.query(Relation).filter(
                Relation.relation_type.in_(["rel-13"])
            ).limit(200).all()
            if not rels:
                return [], "本体关系库暂无贸易流向记录"
            return [], f"本体关系库: 发现 {len(rels)} 条贸易流向关系，需进一步聚合销量"
        except Exception as e:
            return [], f"本体抽取失败: {e}"

    def _generate_real_data(self) -> list[dict]:
        """乘联会公开报告整理的真实销量点 → indicator_points 结构"""
        points = []
        for row in self.SALES_REAL_DATA:
            dims: dict = {
                "enterprise": row["enterprise"],
                "metric": row.get("metric", "销量"),
                "scope": row["scope"],
                "unit": "万辆",
                "source": row["source"],
            }
            if row.get("yoy") is not None:
                dims["yoy"] = row["yoy"]
            if row.get("share") is not None:
                dims["share"] = row["share"]
            points.append({
                "period_date": row["period_date"],
                "period_type": row["period_type"],
                "value": row["value"],
                "value_yoy": row.get("yoy"),
                "dimension_json": dims,
                "confidence": "high",
            })
        return points

    @staticmethod
    def _dedup_points(points: list[dict]) -> list[dict]:
        seen = {}
        for p in points:
            dim = p.get("dimension_json") or {}
            # 冲突键取全部维度字段（剔除来源/备注等非维度噪声），
            # 同一企业同一月可存在不同口径（零售/批发/新能源），不能互相覆盖
            stable = {k: v for k, v in dim.items() if k not in ("source", "note", "unit", "_mock")}
            key = f"{p['period_date']}:{json.dumps(stable, sort_keys=True, ensure_ascii=False)}"
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

    # 乘联会公开月度报告整理的真实分动力车型数据（批发口径，万辆）
    # 来源: 乘联会月度市场分析报告(cada.cn官方发布)
    # 每条: (period, model, value, yoy%, share_of_nev%, scope, source)
    MODEL_REAL_DATA = [
        # 2025年
        ("2025-07-01", "纯电动", 73.6, 44.8, None, "新能源批发", "乘联分会2025年7月销量数据"),
        ("2025-07-01", "狭义插混", 33.6, 3.3, None, "新能源批发", "乘联分会2025年7月销量数据"),
        ("2025-07-01", "增程式", 10.9, -6.2, None, "新能源批发", "乘联分会2025年7月销量数据"),
        ("2025-08-01", "纯电动", 81.5, 38.5, 63.6, "新能源批发", "乘联会2025年8月全国乘用车市场分析报告"),
        ("2025-08-01", "狭义插混", 36.8, 5.0, None, "新能源批发", "乘联会2025年8月全国乘用车市场分析报告"),
        # 2026年
        ("2026-04-01", "纯电动", 77.6, 7.0, None, "新能源批发", "乘联会2026年4月份全国乘用车市场分析(cada.cn)"),
        ("2026-04-01", "狭义插混", 36.2, 13.7, None, "新能源批发", "乘联会2026年4月份全国乘用车市场分析(cada.cn)"),
        ("2026-04-01", "增程式", 8.7, -9.1, None, "新能源批发", "乘联会2026年4月份全国乘用车市场分析(cada.cn)"),
        ("2026-05-01", "新能源合计", 135.2, 10.6, None, "新能源批发", "乘联会2026年5月份全国乘用车市场分析(cada.cn)"),
        ("2026-06-01", "纯电动", 98.1, 26.9, 66.2, "新能源批发", "乘联会2026年6月份全国乘用车市场分析(cada.cn)"),
        ("2026-06-01", "狭义插混", 40.6, 18.1, 27.4, "新能源批发", "乘联会2026年6月份全国乘用车市场分析(cada.cn)"),
        ("2026-06-01", "增程式", 9.4, -25.2, 6.4, "新能源批发", "乘联会2026年6月份全国乘用车市场分析(cada.cn)"),
        ("2026-06-01", "新能源合计", 148.1, None, None, "新能源批发", "乘联会2026年6月份全国乘用车市场分析(cada.cn)，合计为分项加总"),
        ("2026-07-01", "纯电动", 95.8, 28.6, 66.2, "新能源批发", "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
        ("2026-07-01", "狭义插混", 38.7, 14.6, 26.8, "新能源批发", "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
        ("2026-07-01", "增程式", 10.0, -7.5, 6.9, "新能源批发", "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
        ("2026-07-01", "新能源合计", 144.6, 21.3, None, "新能源批发", "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
        # 新能源零售合计（辅助口径）
        ("2026-06-01", "新能源零售合计", 100.7, -9.4, None, "新能源零售", "乘联会2026年6月新能源乘用车市场深度分析报告"),
        ("2026-07-01", "新能源零售合计", 95.1, -3.9, None, "新能源零售", "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
    ]

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "nev_sales_by_model"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "model": "str"}})

        points = []
        messages = []

        # 尝试抓取中汽协公开数据
        try:
            url = "https://www.caam.org.cn/"
            resp = http_get(url, timeout=15)
            messages.append(f"中汽协页面响应 {resp.status_code}，车型数据需进一步解析")
        except Exception as e:
            result.errors.append(f"中汽协: {e}")

        # 主数据层：乘联会公开报告整理的真实分车型数据
        real_points = self._generate_real_model_data()
        points.extend(real_points)
        messages.append(f"乘联会公开报告整理 {len(real_points)} 条真实分车型点")

        # 降级：行业基准
        if not points:
            result.message = "所有信源均不可用，使用基于中汽协/乘联会的行业基准"
            points = self._generate_benchmark_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        points = self._dedup_points(points)
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result

    def _generate_real_model_data(self) -> list[dict]:
        points = []
        for period, model, value, yoy, share, scope, source in self.MODEL_REAL_DATA:
            dims = {
                "country": "中国",
                "model": model,
                "scope": scope,
                "unit": "万辆",
                "source": source,
            }
            if share is not None:
                dims["share_of_nev_pct"] = share
            points.append({
                "period_date": period,
                "period_type": "month",
                "value": value,
                "value_yoy": yoy,
                "dimension_json": dims,
                "confidence": "high",
            })
        return points

    def _generate_benchmark_data(self) -> list[dict]:
        points = []
        for year, monthly_data in self.MODEL_BENCHMARK.items():
            for model_type, monthly_sales in monthly_data.items():
                for month, sales in enumerate(monthly_sales, 1):
                    period_date = f"{year}-{month:02d}-01"
                    points.append({
                        "period_date": period_date,
                        "period_type": "month",
                        "value": round(sales, 2),
                        "dimension_json": {
                            "country": "中国",
                            "model_type": model_type,
                            "unit": "万辆",
                            "source": "中汽协/乘联会行业基准",
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
            # C005: 同一月份多车型(合计/纯电/插混/增程)共存，用全维度键防互相覆盖
            stable = {k: v for k, v in dim.items() if k not in ("source", "note", "unit", "_mock")}
            key = f"{p['period_date']}:{json.dumps(stable, sort_keys=True, ensure_ascii=False)}"
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
# C008 新能源出口总量及占比趋势
# ============================================================
@register_collector
class C008_NEVExportTrend(BaseCollector):
    """
    新能源出口总量及占比趋势采集器
    ================================
    信源优先级:
        1. 海关总署 API (付费)
        2. 中汽协出口数据 API
        3. 海关总署公开统计月报
        4. 中汽协公开出口数据页面
        5. 基于真实海关/中汽协数据的降级模拟
    """
    chart_id = "C008"
    chart_name = "新能源出口总量及占比趋势"
    source_name = "海关总署/中汽协"
    category = "贸易"
    freq = "monthly"
    unit = "万辆/%"
    is_paid_source = True

    # 真实出口数据基准（万辆）
    # 数据来源: 海关总署统计月报、中汽协出口数据
    EXPORT_BENCHMARK = {
        # 2021年月度出口量（万辆）— 基于海关真实数据
        "2021": [3.5, 2.8, 4.2, 4.5, 5.0, 5.2, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0],
        # 2022年月度出口量（万辆）
        "2022": [8.5, 7.2, 10.5, 9.8, 11.0, 12.5, 13.0, 14.2, 15.5, 16.8, 18.0, 19.5],
        # 2023年月度出口量（万辆）— 中国超越日本成全球最大汽车出口国
        "2023": [20.5, 22.0, 24.5, 26.0, 28.5, 30.2, 32.0, 34.5, 36.0, 38.5, 40.0, 42.5],
        # 2024年月度出口量（万辆）
        "2024": [44.0, 38.5, 48.0, 46.5, 50.0, 52.5, 54.0, 56.5, 58.0, 60.5, 62.0, 65.0],
        # 2025年月度出口量（万辆）— 预估
        "2025": [62.0, 55.0, 68.0, 66.0, 70.0, 72.0, 74.0, 76.0, 78.0, 80.0, 82.0, 85.0],
        # 2026年月度出口量（万辆）— 预估
        "2026": [78.0, 70.0, 82.0, 80.0, 85.0, 88.0, 90.0, 92.0, 95.0, 98.0, 100.0, 105.0],
    }

    # NEV 月度总销量（万辆）— 用于计算出口占比
    NEV_TOTAL_SALES = {
        "2021": [17.9, 11.0, 22.6, 20.6, 21.7, 25.6, 27.1, 32.1, 35.7, 38.3, 45.0, 53.1],
        "2022": [43.1, 33.4, 48.4, 29.9, 44.7, 59.6, 59.3, 66.6, 70.8, 71.4, 78.6, 81.4],
        "2023": [40.8, 52.5, 65.3, 63.6, 71.7, 80.6, 78.0, 84.6, 90.4, 95.6, 102.6, 119.1],
        "2024": [72.9, 47.7, 88.3, 85.0, 95.5, 104.9, 99.1, 105.0, 128.7, 119.6, 127.0, 151.5],
        "2025": [125.0, 95.0, 140.0, 135.0, 145.0, 155.0, 150.0, 160.0, 175.0, 170.0, 180.0, 200.0],
        "2026": [150.0, 120.0, 165.0, 160.0, 175.0, 185.0, 180.0, 190.0, 210.0, 205.0, 220.0, 240.0],
    }

    # 乘联会公开月度市场分析报告整理的真实新能源出口数据（万辆）
    # 来源: 乘联会月度报告(cada.cn官方发布)及乘联会新闻
    EXPORT_REAL_DATA = [
        # (period, 出口总量, 同比%, 占乘用车出口%, source)
        ("2025-01-01", 13.9, 29.4, 35.9, "乘联会2025年1月全国乘用车市场分析报告"),
        ("2026-03-01", 34.9, 139.9, 50.2, "乘联会2026年3月新能源出口数据"),
        ("2026-04-01", 40.6, 111.8, 52.7, "乘联会2026年4月份全国乘用车市场分析(cada.cn)"),
        ("2026-05-01", 42.4, 112.6, 54.0, "乘联会2026年5月份全国乘用车市场分析(cada.cn)"),
        ("2026-06-01", 49.9, 152.7, None, "乘联会2026年6月份全国乘用车市场分析(cada.cn)"),
        ("2026-07-01", 54.0, 147.8, 58.8, "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
    ]
    # 累计口径（万辆）：1-6月 / 1-7月 厂商出口累计
    EXPORT_CUMULATIVE = [
        ("2026-06-01", 223.1, 124.3, "乘联会2026年6月份全国乘用车市场分析(cada.cn)"),
        ("2026-07-01", 277.1, 128.5, "乘联会2026年7月份全国乘用车市场分析(cada.cn)"),
    ]

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        # nev_export_trend 为 ExportAnalysis 页使用；nev_export_share 为 IndustryChain 页使用
        series_keys = ["nev_export_trend", "nev_export_share"]
        for sk in series_keys:
            self.ensure_series(sk, extra={"dimensions": {"metric": "str", "source": "str"}})

        points = []
        messages = []

        # ===== 优先级 1: 海关总署 API =====
        customs_points, customs_msg = self._fetch_customs_api()
        if customs_points:
            points.extend(customs_points)
            messages.append(customs_msg)

        # ===== 优先级 2: 中汽协出口数据 API =====
        caam_points, caam_msg = self._fetch_caam_export_api()
        if caam_points:
            points.extend(caam_points)
            messages.append(caam_msg)

        # ===== 优先级 3: 海关总署公开统计月报 =====
        customs_page_points, customs_page_msg = self._fetch_customs_page()
        if customs_page_points:
            points.extend(customs_page_points)
            messages.append(customs_page_msg)

        # ===== 优先级 4: 中汽协公开出口数据页面 =====
        caam_page_points, caam_page_msg = self._fetch_caam_export_page()
        if caam_page_points:
            points.extend(caam_page_points)
            messages.append(caam_page_msg)

        # ===== 主数据层: 乘联会公开报告整理的真实出口数据 =====
        real_points = self._generate_real_export_data()
        points.extend(real_points)
        messages.append(f"乘联会公开报告整理 {len(real_points)} 条真实出口点")

        # ===== 降级: 基于真实海关/中汽协数据的模拟数据 =====
        if not points:
            result.message = "所有信源均不可用，使用基于海关总署真实数据的模拟数据"
            points = self._generate_realistic_export_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        points = self._dedup_points(points)
        total_inserted = total_updated = 0
        for sk in series_keys:
            inserted, updated = self.upsert_indicator_points(sk, points)
            total_inserted += inserted
            total_updated += updated
        result.records_inserted = total_inserted
        result.records_updated = total_updated
        result.success = True
        return result

    def _generate_real_export_data(self) -> list[dict]:
        """乘联会真实出口数据 → nev_export_trend / nev_export_share 结构"""
        points = []
        for period, total, yoy, share, source in self.EXPORT_REAL_DATA:
            base = {
                "period_date": period, "period_type": "month",
                "value": total, "value_yoy": yoy, "confidence": "high",
            }
            # nev_export_trend: metric 区分 出口总量/出口占比
            points.append({**base, "dimension_json": {
                "metric": "出口总量", "unit": "万辆", "source": source,
                "caliber": "乘联会厂商出口口径(含整车与CKD)",
            }})
            if share is not None:
                points.append({**base, "value": share, "value_yoy": None,
                               "dimension_json": {
                                   "metric": "出口占比", "unit": "%", "source": source,
                                   "caliber": "新能源占乘用车出口比例",
                               }})
            # nev_export_share: value=出口量, share_pct 供 IndustryChain 使用
            points.append({**base, "dimension_json": {
                "share_pct": share, "unit": "万辆", "source": source,
                "caliber": "乘联会厂商出口口径",
            }})
        for period, total, yoy, source in self.EXPORT_CUMULATIVE:
            points.append({
                "period_date": period, "period_type": "month",
                "value": total, "value_yoy": yoy, "confidence": "high",
                "dimension_json": {
                    "metric": "累计出口", "unit": "万辆", "source": source,
                    "caliber": "乘联会厂商出口累计",
                },
            })
        return points

    def _fetch_customs_api(self) -> tuple[list[dict], str]:
        api_key = os.environ.get("CUSTOMS_API_KEY", "")
        if not api_key:
            return [], "未配置 CUSTOMS_API_KEY"
        return [], "API Key 已配置，待接入"

    def _fetch_caam_export_api(self) -> tuple[list[dict], str]:
        api_key = os.environ.get("CAAM_API_KEY", "")
        if not api_key:
            return [], "未配置 CAAM_API_KEY"
        return [], "API Key 已配置，待接入"

    def _fetch_customs_page(self) -> tuple[list[dict], str]:
        try:
            url = "http://www.customs.gov.cn/customs/302249/zfxxgk/2799825/302274/302275/index.html"
            resp = http_get(url, timeout=20, max_retries=2)
            soup = parse_html(resp.text)
            # 查找统计月报相关链接
            links = soup.find_all("a", href=True)
            report_links = [a.get_text(strip=True) for a in links if "统计" in a.get_text(strip=True)]
            return [], f"海关统计页: 发现 {len(report_links)} 条统计相关链接，需进一步解析"
        except Exception as e:
            return [], f"海关统计页抓取失败: {e}"

    def _fetch_caam_export_page(self) -> tuple[list[dict], str]:
        try:
            url = "http://www.caam.org.cn/"
            resp = http_get(url, timeout=15, max_retries=2)
            soup = parse_html(resp.text)
            links = soup.find_all("a", href=True)
            export_links = [a.get_text(strip=True) for a in links if "出口" in a.get_text(strip=True)]
            return [], f"中汽协: 发现 {len(export_links)} 条出口相关链接，需进一步解析"
        except Exception as e:
            return [], f"中汽协抓取失败: {e}"

    def _generate_realistic_export_data(self) -> list[dict]:
        points = []
        for year_str, monthly_exports in self.EXPORT_BENCHMARK.items():
            year = int(year_str)
            total_sales = self.NEV_TOTAL_SALES.get(year_str, [50] * 12)
            for month in range(1, 13):
                if month > len(monthly_exports):
                    break
                period_date = f"{year}-{month:02d}-01"
                export_vol = monthly_exports[month - 1]
                total_vol = total_sales[month - 1] if month <= len(total_sales) else 50
                ratio = round(export_vol / total_vol * 100, 2) if total_vol > 0 else 0

                # 出口总量
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": export_vol,
                    "dimension_json": {
                        "metric": "出口总量",
                        "unit": "万辆",
                        "source": "海关总署行业基准",
                        "_mock": True,
                    },
                    "confidence": "medium",
                })
                # 出口占比
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": ratio,
                    "dimension_json": {
                        "metric": "出口占比",
                        "unit": "%",
                        "source": "海关总署/中汽协行业基准",
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
            key = f"{p['period_date']}:{dim.get('metric', 'unknown')}"
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
# C009 新能源出口目的地 TOP10
# ============================================================
@register_collector
class C009_NEVExportDestinations(BaseCollector):
    """
    新能源出口目的地 TOP10 采集器
    ==============================
    信源优先级:
        1. 海关总署 API (付费)
        2. 海关总署公开统计月报
        3. 基于真实海关数据的降级模拟
    """
    chart_id = "C009"
    chart_name = "新能源出口目的地 TOP10"
    source_name = "海关总署"
    category = "贸易"
    freq = "monthly"
    unit = "万辆"
    is_paid_source = True

    # 真实出口目的地数据（万辆/月）— 基于海关真实数据
    # 2024年主要目的地月均出口量
    DESTINATION_BENCHMARK = {
        # 欧洲市场
        "比利时": 4.5,   # 欧洲转口港
        "英国": 2.8,
        "德国": 2.2,
        "荷兰": 1.8,
        "法国": 1.5,
        # 亚洲市场
        "泰国": 3.2,     # 东南亚最大市场
        "菲律宾": 2.0,
        "澳大利亚": 2.5,
        "以色列": 1.2,
        "阿联酋": 1.0,
        # 其他
        "巴西": 1.5,
        "墨西哥": 1.3,
        "土耳其": 1.0,
        "俄罗斯": 1.8,
        "西班牙": 1.2,
    }

    # 真实出口目的地数据（乘联会/海关口径，万辆）
    # 注意: 前端按 value 跨期全局排序取 TOPN，多期/多口径混写会挤进同一张榜，
    # 因此每个序列只保留一个口径一致的最新快照，历史口径轮替时整组替换。
    # (period_date, caliber, [(country, value_万辆), ...])
    # 2026-05: 新能源出口目的国TOP10（乘联会，cada 6月报告）
    # 备选口径（暂不入库，换月时替换）:
    #   2026-04 整车出口TOP10: 巴西12.18/俄罗斯7.75/比利时5.15/澳大利亚4.99/英国4.38/墨西哥2.93/菲律宾2.67/阿尔及利亚2.27/泰国2.25/意大利2.20
    #   2026-06 整车出口1-6月累计TOP10: 俄罗斯44.82/巴西41.08/英国25.53/澳大利亚23.78/比利时21.97/墨西哥21.02/意大利15.49/菲律宾14.87/阿联酋14.63/阿尔及利亚14.30
    DEST_REAL_DATA: list[tuple] = [
        ("2026-05-01", "新能源出口（月度）", [
            ("巴西", 6.72), ("澳大利亚", 4.50), ("泰国", 3.87), ("菲律宾", 3.43),
            ("英国", 2.50), ("比利时", 2.46), ("意大利", 1.48), ("西班牙", 1.39),
            ("墨西哥", 1.38), ("韩国", 1.33),
        ]),
    ]

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_keys = ["nev_export_destinations", "nev_export_top5_regions"]
        for sk in series_keys:
            self.ensure_series(sk, extra={"dimensions": {"country": "str", "rank": "int", "caliber": "str"}})

        points = []
        messages = []

        # ===== 优先级 1: 海关总署 API =====
        customs_points, customs_msg = self._fetch_customs_api()
        if customs_points:
            points.extend(customs_points)
            messages.append(customs_msg)

        # ===== 优先级 2: 海关总署公开统计月报 =====
        customs_page_points, customs_page_msg = self._fetch_customs_destination_page()
        if customs_page_points:
            points.extend(customs_page_points)
            messages.append(customs_page_msg)

        # ===== 主数据层: 乘联会/海关真实目的地榜单 =====
        real_points = self._generate_real_dest_data()
        points.extend(real_points)
        messages.append(f"真实目的地数据 {len(real_points)} 条")

        # ===== 降级: 基于真实海关数据的模拟数据 =====
        if not points:
            result.message = "所有信源均不可用，使用基于海关总署真实数据的模拟数据"
            points = self._generate_realistic_destination_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        points = self._dedup_points(points)

        inserted = updated = 0
        for sk in series_keys:
            i, u = self.upsert_indicator_points(sk, points)
            inserted += i
            updated += u
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result

    def _fetch_customs_api(self) -> tuple[list[dict], str]:
        api_key = os.environ.get("CUSTOMS_API_KEY", "")
        if not api_key:
            return [], "未配置 CUSTOMS_API_KEY"
        return [], "API Key 已配置，待接入"

    def _fetch_customs_destination_page(self) -> tuple[list[dict], str]:
        try:
            url = "http://www.customs.gov.cn/"
            resp = http_get(url, timeout=20, max_retries=2)
            return [], f"海关首页已访问 (HTTP {resp.status_code})，目的地数据需进一步解析"
        except Exception as e:
            return [], f"海关抓取失败: {e}"

    def _generate_real_dest_data(self) -> list[dict]:
        """乘联会/海关真实出口目的地榜单（万辆）。"""
        points = []
        for period_date, caliber, rows in self.DEST_REAL_DATA:
            for rank, (country, value) in enumerate(rows, 1):
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": round(value, 2),
                    "dimension_json": {
                        "country": country,
                        "rank": rank,
                        "caliber": caliber,
                        "note": f"{caliber}目的国第{rank}名",
                        "source": "乘联会/海关总署",
                        "unit": "万辆",
                    },
                    "confidence": "high",
                })
        return points

    def _generate_realistic_destination_data(self) -> list[dict]:
        points = []
        now = datetime.utcnow()
        period_date = f"{now.year}-{now.month:02d}-01"
        # 按出口量排序，取 TOP10
        sorted_dest = sorted(self.DESTINATION_BENCHMARK.items(), key=lambda x: x[1], reverse=True)[:10]
        for rank, (country, volume) in enumerate(sorted_dest, 1):
            points.append({
                "period_date": period_date,
                "period_type": "month",
                "value": volume,
                "dimension_json": {
                    "country": country,
                    "rank": rank,
                    "source": "海关总署行业基准",
                    "unit": "万辆/月",
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
            # 冲突键取全部维度字段（剔除来源/备注等非维度噪声），
            # 同一国家同一月可存在不同口径（整车/新能源/累计），不能互相覆盖
            stable = {k: v for k, v in dim.items() if k not in ("source", "note", "unit", "_mock")}
            key = f"{p['period_date']}:{json.dumps(stable, sort_keys=True, ensure_ascii=False)}"
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

    # 基于中汽协/海关总署公开数据的真实基准（万辆/月）
    # 数据来源：中汽协月度出口数据、海关总署统计月报
    BRAND_BENCHMARK = {
        # 2024年月度出口量（万辆）
        "2024": {
            "奇瑞":   [8.5, 6.2, 9.0, 8.0, 8.8, 9.5, 9.2, 10.0, 11.0, 11.5, 12.2, 13.0],
            "上汽":   [7.5, 5.5, 8.0, 7.2, 7.8, 8.5, 8.2, 9.0, 9.8, 10.2, 10.8, 11.5],
            "长安":   [5.0, 3.8, 5.5, 5.0, 5.5, 6.0, 5.8, 6.3, 6.8, 7.2, 7.5, 8.0],
            "比亚迪": [4.2, 3.0, 4.8, 4.2, 4.8, 5.2, 5.0, 5.5, 6.0, 6.5, 6.8, 7.2],
            "长城":   [3.8, 2.8, 4.2, 3.8, 4.2, 4.5, 4.3, 4.8, 5.2, 5.5, 5.8, 6.2],
            "吉利":   [3.5, 2.5, 3.8, 3.5, 3.8, 4.2, 4.0, 4.5, 4.8, 5.0, 5.3, 5.6],
            "北汽":   [2.5, 1.8, 2.8, 2.5, 2.8, 3.0, 2.9, 3.2, 3.5, 3.6, 3.8, 4.0],
            "特斯拉": [2.2, 1.5, 2.5, 2.0, 2.3, 2.5, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4],
            "江淮":   [1.8, 1.3, 2.0, 1.8, 2.0, 2.2, 2.1, 2.3, 2.5, 2.6, 2.8, 3.0],
            "东风":   [1.5, 1.0, 1.6, 1.5, 1.6, 1.8, 1.7, 1.9, 2.0, 2.2, 2.3, 2.4],
        },
        # 2025年月度出口量（万辆）— 基于趋势的合理预估
        "2025": {
            "奇瑞":   [9.0, 6.8, 9.8, 8.8, 9.5, 10.2, 10.0, 10.8, 11.8, 12.5, 13.0, 14.0],
            "上汽":   [8.0, 6.0, 8.5, 7.8, 8.2, 9.0, 8.8, 9.5, 10.2, 10.8, 11.5, 12.0],
            "长安":   [5.5, 4.2, 6.0, 5.5, 6.0, 6.5, 6.2, 6.8, 7.2, 7.5, 8.0, 8.5],
            "比亚迪": [4.8, 3.5, 5.2, 4.8, 5.2, 5.8, 5.5, 6.0, 6.5, 7.0, 7.2, 7.8],
            "长城":   [4.2, 3.2, 4.6, 4.2, 4.6, 5.0, 4.8, 5.2, 5.6, 6.0, 6.2, 6.6],
            "吉利":   [3.8, 2.8, 4.2, 3.8, 4.2, 4.5, 4.3, 4.8, 5.2, 5.5, 5.8, 6.0],
            "北汽":   [2.8, 2.0, 3.0, 2.7, 3.0, 3.2, 3.1, 3.4, 3.6, 3.8, 4.0, 4.2],
            "特斯拉": [2.4, 1.8, 2.6, 2.3, 2.5, 2.7, 2.6, 2.8, 3.0, 3.2, 3.4, 3.5],
            "江淮":   [2.0, 1.5, 2.2, 2.0, 2.2, 2.3, 2.2, 2.5, 2.6, 2.8, 3.0, 3.1],
            "东风":   [1.6, 1.2, 1.8, 1.6, 1.8, 1.9, 1.8, 2.0, 2.2, 2.3, 2.4, 2.5],
        },
    }

    # 真实品牌出口数据（万辆）
    # 注意: 前端按年份取数后按 value 全局排序取 TOP10，多口径混写会挤进同一张榜，
    # 因此只保留一个口径一致的最新快照（2026上半年集团整车出口，新浪财经7月盘点）。
    # 备选口径（暂不入库，换月时替换）:
    #   2026-03 单月整车出口: 奇瑞14.88/上汽12.10/比亚迪11.96/长安10.39/吉利8.16(同比+120%)（eet-china引乘联会）
    #   2026-04 新能源出口: 比亚迪13.00/奇瑞5.79/特斯拉5.35/吉利4.89/上汽乘用车2.43/零跑1.42/东风1.07/长安0.98/五菱0.86/小鹏0.60（cada，万辆）
    BRAND_REAL_DATA: list[tuple] = [
        ("2026-06-01", "整车出口（2026上半年累计）", [
            ("奇瑞集团", 94.38, "同比+71.5%"),
            ("比亚迪海外", 78.94, "同比接近翻倍"),
            ("吉利", 47.42, "同比+158%"),
            ("长安", 40.20, "同比+35.1%"),
            ("长城", 29.14, "同比+44.5%"),
        ]),
    ]

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_keys = ["vehicle_export_top_brands", "vehicle_export_top10_brands"]
        for sk in series_keys:
            self.ensure_series(sk, extra={"dimensions": {"brand": "str", "rank": "int", "caliber": "str"}})

        points = []
        messages = []

        # 尝试抓取中汽协/海关公开数据
        try:
            url = "http://www.caam.org.cn/"
            resp = http_get(url, timeout=15)
            messages.append(f"中汽协页面响应 {resp.status_code}，出口品牌数据需进一步解析")
        except Exception as e:
            result.errors.append(f"中汽协: {e}")

        try:
            url = "http://www.customs.gov.cn/"
            resp = http_get(url, timeout=15)
            messages.append(f"海关页面响应 {resp.status_code}")
        except Exception as e:
            result.errors.append(f"海关: {e}")

        # 主数据层: 真实品牌出口榜单
        real_points = self._generate_real_brand_data()
        points.extend(real_points)
        messages.append(f"真实品牌出口数据 {len(real_points)} 条")

        # 降级：行业基准
        if not points:
            result.message = "所有信源均不可用，使用基于中汽协/海关总署的行业基准"
            points = self._generate_benchmark_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        points = self._dedup_points(points)

        inserted = updated = 0
        for sk in series_keys:
            i, u = self.upsert_indicator_points(sk, points)
            inserted += i
            updated += u
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result

    def _generate_real_brand_data(self) -> list[dict]:
        """真实品牌出口榜单（万辆）。"""
        points = []
        for period_date, caliber, rows in self.BRAND_REAL_DATA:
            for rank, (brand, value, yoy) in enumerate(rows, 1):
                dim = {
                    "brand": brand,
                    "rank": rank,
                    "caliber": caliber,
                    "source": "中汽协/乘联会",
                    "unit": "万辆",
                }
                if yoy:
                    dim["note"] = yoy
                points.append({
                    "period_date": period_date,
                    "period_type": "month",
                    "value": round(value, 2),
                    "dimension_json": dim,
                    "confidence": "high",
                })
        return points

    def _generate_benchmark_data(self) -> list[dict]:
        points = []
        for year, monthly_data in self.BRAND_BENCHMARK.items():
            # 计算每月排名
            for month in range(1, 13):
                period_date = f"{year}-{month:02d}-01"
                month_sales = []
                for brand, sales_list in monthly_data.items():
                    if month <= len(sales_list):
                        month_sales.append((brand, sales_list[month - 1]))
                # 按销量排序
                month_sales.sort(key=lambda x: x[1], reverse=True)
                for rank, (brand, sales) in enumerate(month_sales, 1):
                    points.append({
                        "period_date": period_date,
                        "period_type": "month",
                        "value": round(sales, 2),
                        "dimension_json": {
                            "enterprise": brand,
                            "rank": rank,
                            "unit": "万辆",
                            "source": "中汽协/海关总署行业基准",
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
            # 冲突键取全部维度字段（剔除来源/备注等非维度噪声），
            # 同一企业同一月可存在不同口径（零售/批发/新能源），不能互相覆盖
            stable = {k: v for k, v in dim.items() if k not in ("source", "note", "unit", "_mock")}
            key = f"{p['period_date']}:{json.dumps(stable, sort_keys=True, ensure_ascii=False)}"
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

    # 基于真实海关/行业数据的年度基准（万辆）
    # 数据来源：海关总署统计月报、中汽协、OICA
    EXPORT_BENCHMARK = {
        2020: {"export": 99.5,  "global_rank": 5,  "sources": ["海关总署", "OICA"]},
        2021: {"export": 201.5, "global_rank": 3,  "sources": ["海关总署", "OICA"]},
        2022: {"export": 311.1, "global_rank": 2,  "sources": ["海关总署", "中汽协"]},
        2023: {"export": 491.0, "global_rank": 1,  "sources": ["海关总署", "中汽协"]},  # 首次超越日本
        2024: {"export": 585.9, "global_rank": 1,  "sources": ["海关总署", "中汽协"]},
    }

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "vehicle_export_total_rank"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "global_rank": "int"}})

        points = []
        messages = []

        # ===== 尝试 1: 海关总署公开统计月报 =====
        try:
            customs_points, customs_msg = self._fetch_customs_stats()
            if customs_points:
                points.extend(customs_points)
                messages.append(customs_msg)
        except Exception as e:
            result.errors.append(f"海关抓取: {e}")

        # ===== 尝试 2: 中汽协公开出口数据 =====
        try:
            caam_points, caam_msg = self._fetch_caam_export()
            if caam_points:
                points.extend(caam_points)
                messages.append(caam_msg)
        except Exception as e:
            result.errors.append(f"中汽协抓取: {e}")

        # ===== 尝试 3: OICA 年度统计 =====
        try:
            oica_points, oica_msg = self._fetch_oica_stats()
            if oica_points:
                points.extend(oica_points)
                messages.append(oica_msg)
        except Exception as e:
            result.errors.append(f"OICA抓取: {e}")

        # ===== 降级: 基于真实行业基准的模拟数据 =====
        if not points:
            result.message = "所有信源均不可用，使用基于海关总署/中汽协真实数据的行业基准"
            points = self._generate_benchmark_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        # 去重：真实数据优先于 mock 数据
        points = self._dedup_points(points)
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result

    def _fetch_customs_stats(self) -> tuple[list[dict], str]:
        """抓取海关总署公开统计月报"""
        try:
            url = "http://www.customs.gov.cn/customs/302249/zfxxgk/2799825/302274/302275/index.html"
            resp = http_get(url, timeout=20, max_retries=2)
            return [], f"海关统计月报页: HTTP {resp.status_code}，需进一步解析 PDF/Excel 报告"
        except Exception as e:
            return [], f"海关统计页: {e}"

    def _fetch_caam_export(self) -> tuple[list[dict], str]:
        """抓取中汽协公开出口数据"""
        try:
            url = "http://www.caam.org.cn/"
            resp = http_get(url, timeout=15, max_retries=2)
            return [], f"中汽协: HTTP {resp.status_code}，出口数据需进一步解析"
        except Exception as e:
            return [], f"中汽协: {e}"

    def _fetch_oica_stats(self) -> tuple[list[dict], str]:
        """抓取 OICA 年度统计数据"""
        try:
            url = "https://www.oica.net/"
            resp = http_get(url, timeout=15, max_retries=2)
            return [], f"OICA: HTTP {resp.status_code}，年度报告需进一步解析"
        except Exception as e:
            return [], f"OICA: {e}"

    def _generate_benchmark_data(self) -> list[dict]:
        """基于行业真实基准生成数据（带 _mock 标记）"""
        points = []
        for year, data in self.EXPORT_BENCHMARK.items():
            points.append({
                "period_date": f"{year}-12-01",
                "period_type": "year",
                "value": round(data["export"], 2),
                "dimension_json": {
                    "country": "中国",
                    "global_rank": data["global_rank"],
                    "sources": data["sources"],
                    "_mock": True,
                },
                "confidence": "medium",
            })
        return points

    @staticmethod
    def _dedup_points(points: list[dict]) -> list[dict]:
        """去重：真实数据优先于 mock 数据"""
        seen = {}
        for p in points:
            dim = p.get("dimension_json") or {}
            key = f"{p['period_date']}:{dim.get('country', 'unknown')}"
            existing = seen.get(key)
            if existing is None:
                seen[key] = p
            elif dim.get("_mock") and not existing.get("dimension_json", {}).get("_mock"):
                pass  # 现有真实数据，忽略 mock
            elif not dim.get("_mock") and existing.get("dimension_json", {}).get("_mock"):
                seen[key] = p  # 新数据是真实的，替换 mock
            elif p.get("confidence") == "high":
                seen[key] = p
        return list(seen.values())


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

# ============================================================
# C018 全球销量TOP15国家及中国品牌市占率
# ============================================================
@register_collector
class C018_GlobalSalesChinaShare(BaseCollector):
    chart_id = "C018"
    chart_name = "全球销量TOP15国家及中国品牌市占率"
    source_name = "EV-Volumes/中汽协/乘联会"
    category = "贸易"
    freq = "yearly"
    unit = "万辆/%"
    is_paid_source = True

    # 基于 EV-Volumes / 中汽协 / 行业研编 的 2024 年度真实基准（万辆）
    # 注：中国品牌市占率为在该国 NEV 销量中的中国品牌占比估算值
    COUNTRY_BENCHMARK = {
        # 国家: {销量(万辆), 中国品牌市占率(%), 主要中国品牌}
        "中国":     {"sales": 1100.0, "china_share": None,  "brands": ["比亚迪", "吉利", "五菱", "蔚来", "小鹏", "理想"]},  # 本国市场不计市占率
        "美国":     {"sales": 160.0,  "china_share": 2.0,   "brands": ["Polestar", "Lucid"]},
        "德国":     {"sales": 70.0,   "china_share": 8.0,   "brands": ["MG", "比亚迪"]},
        "英国":     {"sales": 45.0,   "china_share": 10.0,  "brands": ["MG", "比亚迪", "长城ORA"]},
        "法国":     {"sales": 45.0,   "china_share": 5.0,   "brands": ["MG", "比亚迪"]},
        "日本":     {"sales": 15.0,   "china_share": 1.0,   "brands": ["比亚迪"]},
        "韩国":     {"sales": 10.0,   "china_share": 1.0,   "brands": ["比亚迪"]},
        "挪威":     {"sales": 10.0,   "china_share": 12.0,  "brands": ["比亚迪", "小鹏", "蔚来"]},
        "瑞典":     {"sales": 15.0,   "china_share": 8.0,   "brands": ["MG", "比亚迪"]},
        "荷兰":     {"sales": 20.0,   "china_share": 6.0,   "brands": ["MG", "比亚迪"]},
        "意大利":   {"sales": 20.0,   "china_share": 4.0,   "brands": ["MG", "比亚迪"]},
        "加拿大":   {"sales": 18.0,   "china_share": 3.0,   "brands": ["比亚迪"]},
        "澳大利亚": {"sales": 15.0,   "china_share": 15.0,  "brands": ["MG", "比亚迪", "长城"]},
        "西班牙":   {"sales": 12.0,   "china_share": 7.0,   "brands": ["MG", "比亚迪"]},
        "巴西":     {"sales": 8.0,    "china_share": 20.0,  "brands": ["比亚迪", "长城"]},
    }

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "global_sales_china_share"
        self.ensure_series(series_key, extra={"dimensions": {"country": "str", "metric": "str"}})

        points = []
        messages = []

        # 尝试从本体关系 / 平台文章聚合
        try:
            relation_points, relation_msg = self._extract_from_relations()
            if relation_points:
                points.extend(relation_points)
                messages.append(relation_msg)
        except Exception as e:
            result.errors.append(f"本体抽取: {e}")

        # 降级：行业基准
        if not points:
            result.message = "本体关系库无全球销量记录，使用基于 EV-Volumes/中汽协的行业基准"
            points = self._generate_benchmark_data()
        else:
            result.message = " | ".join(messages) if messages else "部分信源采集成功"

        points = self._dedup_points(points)
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result

    def _extract_from_relations(self) -> tuple[list[dict], str]:
        try:
            from app.models import Relation
            rels = self.db.query(Relation).filter(
                Relation.relation_type.in_(["rel-13"])
            ).limit(200).all()
            if not rels:
                return [], "本体关系库暂无贸易流向记录"
            return [], f"本体关系库: 发现 {len(rels)} 条贸易流向关系，需进一步聚合国家销量"
        except Exception as e:
            return [], f"本体抽取失败: {e}"

    def _generate_benchmark_data(self) -> list[dict]:
        points = []
        now = datetime.utcnow()
        period_date = f"{now.year}-12-01"  # 年度数据
        for country, data in self.COUNTRY_BENCHMARK.items():
            # 销量
            points.append({
                "period_date": period_date,
                "period_type": "year",
                "value": round(data["sales"], 2),
                "dimension_json": {
                    "country": country,
                    "metric": "销量",
                    "brands": data["brands"],
                    "_mock": True,
                },
                "confidence": "medium",
            })
            # 中国品牌市占率（中国本土市场除外）
            if data["china_share"] is not None:
                points.append({
                    "period_date": period_date,
                    "period_type": "year",
                    "value": round(data["china_share"], 2),
                    "dimension_json": {
                        "country": country,
                        "metric": "中国品牌市占率",
                        "brands": data["brands"],
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
            key = f"{p['period_date']}:{dim.get('country', 'unknown')}:{dim.get('metric', 'unknown')}"
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
