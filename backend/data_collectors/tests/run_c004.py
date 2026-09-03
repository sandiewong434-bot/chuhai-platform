#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""运行 C004 充电桩保有量采集器"""

import sys
sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from data_collectors.collectors.infrastructure import C004_ChargingPileStock

with C004_ChargingPileStock() as collector:
    result = collector.run()
    print(f"\n{'='*50}")
    print(f"C004 采集结果")
    print(f"{'='*50}")
    print(f"成功: {result.success}")
    print(f"插入: {result.records_inserted}")
    print(f"更新: {result.records_updated}")
    print(f"消息: {result.message}")
    if result.errors:
        print(f"错误: {result.errors}")
