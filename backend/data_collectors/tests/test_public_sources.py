#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
公开源反爬测试
测试国家统计局、SMM、生意社的可达性
"""
import sys
sys.path.insert(0, "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend")

from data_collectors.utils import http_get, http_post
import json


def test_stats_gov():
    """测试国家统计局"""
    print("\n" + "="*60)
    print("[测试1] 国家统计局 - data.stats.gov.cn")
    print("="*60)
    try:
        # 先测试首页可达性
        url = "https://data.stats.gov.cn/"
        resp = http_get(url, timeout=15, max_retries=3)
        print(f"  首页: HTTP {resp.status_code}, 长度 {len(resp.text)}")

        # 测试指标树接口（使用 session 模式）
        tree_url = "https://data.stats.gov.cn/easyquery.htm?m=getTree"
        resp = http_post(tree_url, data={"dbcode": "hgyd", "wdcode": "zb"}, timeout=15, max_retries=3, use_session=True)
        tree_url = "https://data.stats.gov.cn/easyquery.htm?m=getTree"
        resp = http_post(tree_url, data={"dbcode": "hgyd", "wdcode": "zb"}, timeout=15, max_retries=3)
        print(f"  指标树: HTTP {resp.status_code}, 长度 {len(resp.text)}")
        try:
            data = resp.json()
            print(f"  指标树返回 {len(data)} 个节点")
            # 搜索碳酸锂相关
            found = [item for item in data if "锂" in item.get("name", "") or "碳酸" in item.get("name", "")]
            print(f"  含'锂'/'碳酸'的指标: {len(found)}")
            if found:
                for item in found[:5]:
                    print(f"    - {item.get('name')} (ID: {item.get('id')})")
            else:
                print("  ⚠️ 未找到碳酸锂相关指标，可能需要用其他关键词")
        except Exception as e:
            print(f"  ⚠️ 解析JSON失败: {e}")
            print(f"  返回内容前200字: {resp.text[:200]}")
        return True
    except Exception as e:
        print(f"  ❌ 失败: {e}")
        return False


def test_smm():
    """测试 SMM"""
    print("\n" + "="*60)
    print("[测试2] SMM - www.smm.cn")
    print("="*60)
    try:
        # 测试首页
        url = "https://www.smm.cn/"
        resp = http_get(url, timeout=15, max_retries=3)
        print(f"  首页: HTTP {resp.status_code}, 长度 {len(resp.text)}")

        # 测试公开数据库页面
        test_urls = [
            "https://www.smm.cn/mpdb",
            "https://www.smm.cn/mpdb/1705979537764_output_china_Sichuan",
            "https://www.smm.cn/datalist",
        ]
        for u in test_urls:
            try:
                resp = http_get(u, timeout=10, max_retries=2)
                print(f"  {u}: HTTP {resp.status_code}, 长度 {len(resp.text)}")
            except Exception as e:
                print(f"  {u}: ❌ {e}")
        return True
    except Exception as e:
        print(f"  ❌ 失败: {e}")
        return False


def test_100ppi():
    """测试生意社"""
    print("\n" + "="*60)
    print("[测试3] 生意社 - www.100ppi.com")
    print("="*60)
    try:
        # 测试首页
        url = "https://www.100ppi.com/"
        resp = http_get(url, timeout=15, max_retries=3)
        print(f"  首页: HTTP {resp.status_code}, 长度 {len(resp.text)}")

        # 测试新能源板块
        test_urls = [
            "https://www.100ppi.com/news/list-328-1.html",
            "https://www.100ppi.com/graph/index/graph---1-2024-1-2024-12.html",
            "https://www.100ppi.com/vane/detail-1234.html",
        ]
        for u in test_urls:
            try:
                resp = http_get(u, timeout=10, max_retries=2)
                print(f"  {u}: HTTP {resp.status_code}, 长度 {len(resp.text)}")
            except Exception as e:
                print(f"  {u}: ❌ {e}")
        return True
    except Exception as e:
        print(f"  ❌ 失败: {e}")
        return False


if __name__ == "__main__":
    results = {
        "stats.gov.cn": test_stats_gov(),
        "smm.cn": test_smm(),
        "100ppi.com": test_100ppi(),
    }

    print("\n" + "="*60)
    print("【测试结果汇总】")
    print("="*60)
    for site, ok in results.items():
        status = "✅ 成功" if ok else "❌ 失败"
        print(f"  {site}: {status}")
