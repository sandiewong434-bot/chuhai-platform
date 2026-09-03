#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""运行 C002 锂盐价格走势采集器"""

import sys
sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from data_collectors.collectors.supply_chain import C002_LithiumPrice

with C002_LithiumPrice() as collector:
    result = collector.run()
    print(f"\n{'='*50}")
    print(f"C002 采集结果")
    print(f"{'='*50}")
    print(f"成功: {result.success}")
    print(f"插入: {result.records_inserted}")
    print(f"更新: {result.records_updated}")
    print(f"消息: {result.message}")
    if result.errors:
        print(f"错误: {result.errors}")
