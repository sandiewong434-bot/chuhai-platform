#!/usr/bin/env python3
"""运行 C007 动力电池企业装车量排名采集器"""
import sys
sys.path.insert(0, 'backend')

from data_collectors.collectors.supply_chain import C007_BatteryInstallRank

c = C007_BatteryInstallRank()
result = c.collect()
print(f"C007 采集结果: success={result.success}")
print(f"  插入: {result.records_inserted}, 更新: {result.records_updated}")
print(f"  消息: {result.message}")
if result.errors:
    print(f"  错误: {result.errors}")
