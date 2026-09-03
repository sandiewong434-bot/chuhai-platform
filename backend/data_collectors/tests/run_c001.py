#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""运行C001采集器测试数据入库"""
import sys
sys.path.insert(0, "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend")

from data_collectors.collectors.supply_chain import C001_LithiumCapacity

c = C001_LithiumCapacity()
result = c.run()
print(f"成功: {result.success}")
print(f"插入: {result.records_inserted}")
print(f"更新: {result.records_updated}")
print(f"消息: {result.message}")
print(f"错误: {result.errors}")
