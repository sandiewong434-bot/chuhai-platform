# -*- coding: utf-8 -*-
"""
出海平台 · 数据采集统一调度入口

用法:
    # 执行单个图表
    cd backend && python -m data_collectors.run --chart C001

    # 执行某大类全部图表
    cd backend && python -m data_collectors.run --category 产业链

    # 执行全部
    cd backend && python -m data_collectors.run --all

    # 列出所有图表
    cd backend && python -m data_collectors.run --list

    # 定时调度模式 (crontab 推荐)
    cd backend && python -m data_collectors.run --all --daemon
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime

# 将 backend 加入路径
sys.path.insert(0, __import__('pathlib').Path(__file__).parent.parent.as_posix())

from data_collectors.registry import COLLECTOR_REGISTRY, list_collectors


def run_collector(chart_id: str) -> dict:
    """执行单个采集器"""
    from data_collectors.registry import get_collector
    cls = get_collector(chart_id)
    if not cls:
        return {"chart_id": chart_id, "error": "未找到对应采集器"}
    collector = cls()
    result = collector.run()
    return {
        "chart_id": chart_id,
        "chart_name": cls.chart_name,
        **result.to_dict(),
    }


def run_category(category: str) -> list[dict]:
    """执行某分类下的所有采集器"""
    results = []
    for chart_id, cls in COLLECTOR_REGISTRY.items():
        if cls.category == category:
            print(f"\n[RUN] {chart_id} {cls.chart_name} ...")
            r = run_collector(chart_id)
            results.append(r)
            print(f"      -> {'✅' if r.get('success') else '❌'} {r.get('message', '')}")
            time.sleep(1)
    return results


def run_all() -> list[dict]:
    """执行全部采集器"""
    results = []
    for chart_id in sorted(COLLECTOR_REGISTRY.keys()):
        cls = COLLECTOR_REGISTRY[chart_id]
        print(f"\n[RUN] {chart_id} {cls.chart_name} (source: {cls.source_name}) ...")
        r = run_collector(chart_id)
        results.append(r)
        status = "✅" if r.get("success") else ("⚠️" if r.get("records_inserted", 0) > 0 else "❌")
        print(f"      -> {status} inserted={r.get('records_inserted', 0)} updated={r.get('records_updated', 0)} {r.get('message', '')}")
        time.sleep(1.5)
    return results


def main():
    parser = argparse.ArgumentParser(description="出海平台数据采集调度")
    parser.add_argument("--chart", type=str, help="执行单个图表，如 C001")
    parser.add_argument("--category", type=str, help="执行某分类，如 产业链/贸易/投资/技术/基础设施")
    parser.add_argument("--all", action="store_true", help="执行全部采集任务")
    parser.add_argument("--list", action="store_true", help="列出所有图表")
    parser.add_argument("--daemon", action="store_true", help="守护模式：执行完后 sleep 1小时再循环")
    args = parser.parse_args()

    # 延迟导入，确保所有采集器注册完成
    from data_collectors import collectors  # noqa: F401

    if args.list:
        items = list_collectors()
        print(f"\n共注册 {len(items)} 个采集器:\n")
        print(f"{'图表ID':<8} {'分类':<8} {'付费':<4} {'频率':<8} {'图表名称':<30} {'数据来源'}")
        print("-" * 100)
        for it in items:
            paid = "是" if it["paid"] else "否"
            print(f"{it['chart_id']:<8} {it['category']:<8} {paid:<4} {it['freq']:<8} {it['chart_name']:<30} {it['source_name']}")
        return

    if args.chart:
        result = run_collector(args.chart)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if args.category:
        results = run_category(args.category)
        print(f"\n{'='*60}")
        print(f"分类 [{args.category}] 执行完毕: 成功 {sum(1 for r in results if r.get('success'))}/{len(results)}")
        return

    if args.all:
        while True:
            print(f"\n{'='*60}")
            print(f"[SCHEDULE] 开始全量采集 @ {datetime.utcnow().isoformat()}")
            results = run_all()
            success = sum(1 for r in results if r.get("success"))
            total = len(results)
            print(f"\n{'='*60}")
            print(f"[DONE] 总计 {total} 个任务，成功 {success} 个，失败 {total - success} 个")
            if not args.daemon:
                break
            print(f"[DAEMON] 1小时后再次执行...")
            time.sleep(3600)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
