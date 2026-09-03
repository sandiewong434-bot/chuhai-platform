#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试指标数据API"""
import sys
sys.path.insert(0, "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 测试1: 获取指标序列列表
print("=" * 50)
print("[测试1] GET /api/v1/indicators/series")
resp = client.get("/api/v1/indicators/series")
print(f"  状态: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"  序列总数: {data['total']}")
    for s in data['items'][:3]:
        print(f"    - {s['chart_id']}: {s['chart_name']} ({s['series_key']})")

# 测试2: 获取C001时点数据
print("\n" + "=" * 50)
print("[测试2] GET /api/v1/indicators/series/lithium_capacity_production/points")
resp = client.get("/api/v1/indicators/series/lithium_capacity_production/points?limit=10")
print(f"  状态: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"  数据条数: {data['total']}")
    for p in data['items'][:3]:
        dim = p.get('dimension_json', {})
        print(f"    - {p['period_date']} | {dim.get('metric', 'N/A')} = {p['value']} {dim.get('unit', '')}")

# 测试3: 按chart_id获取图表数据
print("\n" + "=" * 50)
print("[测试3] GET /api/v1/indicators/chart/C001")
resp = client.get("/api/v1/indicators/chart/C001")
print(f"  状态: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"  chart_id: {data['chart_id']}")
    for s in data['series']:
        print(f"    序列: {s['series_key']} ({len(s['points'])} 点)")

# 测试4: 获取最新数据
print("\n" + "=" * 50)
print("[测试4] GET /api/v1/indicators/latest")
resp = client.get("/api/v1/indicators/latest?series_keys=lithium_capacity_production&days=30")
print(f"  状态: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    for sk, points in data['data'].items():
        print(f"    {sk}: {len(points)} 条")

print("\n" + "=" * 50)
print("【API链路测试完成】")
