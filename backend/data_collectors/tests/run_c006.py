#!/usr/bin/env python3
"""运行 C006 动力电池产能及利用率采集器"""
import sys
sys.path.insert(0, 'backend')

from data_collectors.collectors.supply_chain import C006_BatteryCapacity

c = C006_BatteryCapacity()
result = c.collect()
print(f"C006 采集结果: success={result.success}")
print(f"  插入: {result.records_inserted}, 更新: {result.records_updated}")
print(f"  消息: {result.message}")
if result.errors:
    print(f"  错误: {result.errors}")
