# -*- coding: utf-8 -*-
"""采集器注册表"""

from __future__ import annotations

from typing import Type

from data_collectors.base import BaseCollector

COLLECTOR_REGISTRY: dict[str, Type[BaseCollector]] = {}


def register_collector(cls: Type[BaseCollector]) -> Type[BaseCollector]:
    """装饰器：自动注册采集器"""
    if not cls.chart_id:
        raise ValueError(f"采集器 {cls.__name__} 缺少 chart_id")
    COLLECTOR_REGISTRY[cls.chart_id] = cls
    return cls


def get_collector(chart_id: str) -> Type[BaseCollector] | None:
    return COLLECTOR_REGISTRY.get(chart_id)


def list_collectors() -> list[dict]:
    """列出所有已注册采集器"""
    return [
        {
            "chart_id": c.chart_id,
            "chart_name": c.chart_name,
            "source_name": c.source_name,
            "category": c.category,
            "freq": c.freq,
            "paid": c.is_paid_source,
        }
        for c in COLLECTOR_REGISTRY.values()
    ]
