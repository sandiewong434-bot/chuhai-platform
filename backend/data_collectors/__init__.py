# -*- coding: utf-8 -*-
"""
出海平台 · 自动化数据采集框架
================================
覆盖 19 张 BI 图表的数据自动/半自动采集

目录结构:
    collectors/     各图表采集器实现
    utils/          公共工具
    run.py          统一调度入口

执行:
    cd backend && python -m data_collectors.run --chart C001
    cd backend && python -m data_collectors.run --all
"""

from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import COLLECTOR_REGISTRY, register_collector, get_collector

__all__ = ["BaseCollector", "CollectorResult", "COLLECTOR_REGISTRY", "register_collector", "get_collector"]
