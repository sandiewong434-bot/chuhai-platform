#!/usr/bin/env python3
import sys
import os

# 确保 CORS_ORIGINS 环境变量正确设置
os.environ['CORS_ORIGINS'] = '["http://localhost:5173", "http://localhost:3000"]'

sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from app.main import app
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# 测试贸易壁垒API
print("=== 测试 /api/v1/barriers ===")
r = client.get('/api/v1/barriers')
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Total: {data.get('total')}")
    for item in data.get('items', [])[:3]:
        print(f"  - [{item.get('country')}] {item.get('title')[:50]}...")
else:
    print(f"Error: {r.text[:500]}")

# 测试企业追踪API
print("\n=== 测试 /api/v1/enterprises ===")
r = client.get('/api/v1/enterprises')
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Total: {data.get('total')}")
    for item in data.get('items', [])[:3]:
        print(f"  - [{item.get('enterprise_name')}] {item.get('title')[:50]}...")
else:
    print(f"Error: {r.text[:500]}")

# 测试企业列表API
print("\n=== 测试 /api/v1/enterprises/list ===")
r = client.get('/api/v1/enterprises/list')
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Enterprises: {[e['name'] for e in data.get('items', [])]}")
else:
    print(f"Error: {r.text[:500]}")
