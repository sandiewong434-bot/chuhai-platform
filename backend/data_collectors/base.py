# -*- coding: utf-8 -*-
"""采集器基类与通用结果结构"""

from __future__ import annotations

import hashlib
import json
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import DataCollectionLog


@dataclass
class CollectorResult:
    """单次采集结果"""
    success: bool = False
    records_inserted: int = 0
    records_updated: int = 0
    message: str = ""
    data: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "records_inserted": self.records_inserted,
            "records_updated": self.records_updated,
            "message": self.message,
            "error_count": len(self.errors),
        }


class BaseCollector(ABC):
    """
    数据采集器基类

    子类必须实现:
        - chart_id: str          图表编号
        - chart_name: str        图表名称
        - source_name: str       数据来源
        - collect() -> CollectorResult
    """

    chart_id: str = ""
    chart_name: str = ""
    source_name: str = ""
    category: str = ""           # 产业链 / 贸易 / 投资 / 技术 / 基础设施
    freq: str = "monthly"        # daily/weekly/monthly/quarterly/yearly
    unit: str = ""

    # 付费源标记: 若为 True，无 API Key 时自动回退到 mock/placeholder
    is_paid_source: bool = False

    def __init__(self, db: Session | None = None, use_mock_fallback: bool = True):
        self.db = db
        self.use_mock_fallback = use_mock_fallback
        self._own_db = db is None

    def __enter__(self):
        if self._own_db:
            self.db = SessionLocal()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._own_db and self.db:
            self.db.close()

    @abstractmethod
    def collect(self) -> CollectorResult:
        """执行采集，子类必须实现"""
        raise NotImplementedError

    def run(self) -> CollectorResult:
        """带日志记录的完整执行流程"""
        started_at = datetime.utcnow()
        result = CollectorResult()
        try:
            with self:
                result = self.collect()
        except Exception as e:
            result.success = False
            result.message = f"采集异常: {e}"
            result.errors.append(str(e))
        finally:
            finished_at = datetime.utcnow()
            self._write_log(started_at, finished_at, result)
        return result

    def _write_log(self, started_at: datetime, finished_at: datetime, result: CollectorResult):
        """写入采集日志"""
        if not self.db:
            return
        log = DataCollectionLog(
            task_name=self.__class__.__name__,
            chart_id=self.chart_id,
            status="success" if result.success else ("partial" if result.records_inserted > 0 else "failed"),
            records_inserted=result.records_inserted,
            records_updated=result.records_updated,
            message=result.message[:1000] if result.message else None,
            started_at=started_at,
            finished_at=finished_at,
        )
        self.db.add(log)
        self.db.commit()

    # ========== 通用工具方法 ==========

    @staticmethod
    def md5_id(*parts: str) -> str:
        """基于内容生成唯一标识"""
        return hashlib.md5("|".join(parts).encode("utf-8")).hexdigest()[:16]

    @staticmethod
    def now_str(fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
        return datetime.utcnow().strftime(fmt)

    def upsert_indicator_points(self, series_key: str, points: list[dict]):
        """
        批量写入/更新指标时点数据
        points: [{"period_date": "2024-01-01", "value": 123.4, "dimension_json": {...}, ...}]
        """
        from app.models import IndicatorPoint
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        inserted = 0
        updated = 0

        for p in points:
            period_date = p.get("period_date")
            if isinstance(period_date, str):
                period_date = datetime.strptime(period_date, "%Y-%m-%d").date()

            dimension_json = p.get("dimension_json") or {}
            dim_key = json.dumps(dimension_json, sort_keys=True, ensure_ascii=False)

            # 查询是否已存在
            existing = self.db.query(IndicatorPoint).filter(
                IndicatorPoint.series_key == series_key,
                IndicatorPoint.period_date == period_date,
            ).all()

            # 维度匹配
            match = None
            for ex in existing:
                ex_dim = ex.dimension_json or {}
                if json.dumps(ex_dim, sort_keys=True, ensure_ascii=False) == dim_key:
                    match = ex
                    break

            if match:
                # 更新
                if "value" in p and p["value"] is not None:
                    match.value = p["value"]
                if "value_yoy" in p:
                    match.value_yoy = p["value_yoy"]
                if "value_mom" in p:
                    match.value_mom = p["value_mom"]
                if "source_raw" in p:
                    match.source_raw = p["source_raw"]
                match.confidence = p.get("confidence", "medium")
                updated += 1
            else:
                # 插入
                pt = IndicatorPoint(
                    series_key=series_key,
                    period_date=period_date,
                    period_type=p.get("period_type", "month"),
                    value=p.get("value"),
                    value_yoy=p.get("value_yoy"),
                    value_mom=p.get("value_mom"),
                    dimension_json=dimension_json,
                    source_raw=p.get("source_raw"),
                    confidence=p.get("confidence", "medium"),
                )
                self.db.add(pt)
                inserted += 1

        self.db.commit()
        return inserted, updated

    def ensure_series(self, series_key: str, extra: dict | None = None):
        """确保指标序列定义存在"""
        from app.models import IndicatorSeries
        series = self.db.query(IndicatorSeries).filter_by(series_key=series_key).first()
        if not series:
            series = IndicatorSeries(
                series_key=series_key,
                chart_id=self.chart_id,
                chart_name=self.chart_name,
                category=self.category,
                source_name=self.source_name,
                freq=self.freq,
                unit=self.unit,
                dimensions=extra.get("dimensions") if extra else None,
                is_active=True,
            )
            self.db.add(series)
            self.db.commit()
        return series

    def fallback_mock_data(self, series_key: str, months: int = 12) -> list[dict]:
        """
        生成模拟时序数据（用于付费源无 API Key 时的降级展示）
        数据带 _mock=true 标记，前端可提示"演示数据"
        """
        import random
        points = []
        base_value = random.uniform(50, 500)
        now = datetime.utcnow()
        for i in range(months, 0, -1):
            month = now.month - i
            year = now.year
            while month <= 0:
                month += 12
                year -= 1
            dt = datetime(year, month, 1).date()
            base_value *= random.uniform(0.92, 1.08)
            points.append({
                "period_date": dt.strftime("%Y-%m-%d"),
                "period_type": "month",
                "value": round(base_value, 2),
                "value_yoy": round(random.uniform(-20, 40), 2),
                "dimension_json": {"_mock": True, "series_key": series_key},
                "confidence": "low",
            })
        return points
        """
        生成模拟时序数据（用于付费源无 API Key 时的降级展示）
        数据带 _mock=true 标记，前端可提示"演示数据"
        """
        import random
        points = []
        base_value = random.uniform(50, 500)
        for i in range(months, 0, -1):
            dt = datetime.utcnow().replace(day=1) - __import__('dateutil.relativedelta', fromlist=['relativedelta']).relativedelta(months=i)
            # 如果没有 dateutil，手动计算
            month = datetime.utcnow().month - i
            year = datetime.utcnow().year
            while month <= 0:
                month += 12
                year -= 1
            dt = datetime(year, month, 1).date()
            base_value *= random.uniform(0.92, 1.08)
            points.append({
                "period_date": dt.strftime("%Y-%m-%d"),
                "period_type": "month",
                "value": round(base_value, 2),
                "value_yoy": round(random.uniform(-20, 40), 2),
                "dimension_json": {"_mock": True},
                "confidence": "low",
            })
        return points
