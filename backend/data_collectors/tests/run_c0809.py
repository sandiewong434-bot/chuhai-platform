#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""运行 C008 和 C009 采集器"""

import sys
sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from data_collectors.collectors.sales_export import C008_NEVExportTrend, C009_NEVExportDestinations

# C008
with C008_NEVExportTrend() as collector:
    result = collector.run()
    print(f"\n{'='*50}")
    print(f"C008 新能源出口总量及占比趋势")
    print(f"{'='*50}")
    print(f"成功: {result.success}")
    print(f"插入: {result.records_inserted}")
    print(f"更新: {result.records_updated}")
    print(f"消息: {result.message}")

# C009
with C009_NEVExportDestinations() as collector:
    result = collector.run()
    print(f"\n{'='*50}")
    print(f"C009 新能源出口目的地 TOP10")
    print(f"{'='*50}")
    print(f"成功: {result.success}")
    print(f"插入: {result.records_inserted}")
    print(f"更新: {result.records_updated}")
    print(f"消息: {result.message}")
