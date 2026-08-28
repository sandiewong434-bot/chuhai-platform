#!/usr/bin/env python3
"""
信源健康监控与告警系统

功能：
1. 检查信源网站 HTTP 可达性
2. 检查最近 N 天是否有新文章入库
3. 生成健康报告（JSON / 文本）
4. 支持 Webhook 告警（飞书 / 钉钉 / 企业微信）

用法：
    python scripts/source_monitor.py --check-all
    python scripts/source_monitor.py --check-source 1
    python scripts/source_monitor.py --report
    python scripts/source_monitor.py --alert

环境变量：
    ALERT_WEBHOOK_URL - 告警 Webhook 地址
    ALERT_DAYS - 检查最近 N 天（默认 3）
    ALERT_TIMEOUT - HTTP 超时秒数（默认 15）
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import httpx
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models import Article, SourceLog

# 告警配置
ALERT_WEBHOOK = os.getenv("ALERT_WEBHOOK_URL", "")
ALERT_DAYS = int(os.getenv("ALERT_DAYS", "3"))
ALERT_TIMEOUT = int(os.getenv("ALERT_TIMEOUT", "15"))


def check_source_http(url: str, timeout: int = ALERT_TIMEOUT) -> dict:
    """检查信源网站 HTTP 可达性"""
    result = {
        "url": url,
        "reachable": False,
        "status_code": None,
        "response_time_ms": None,
        "error": None,
    }
    
    if not url:
        result["error"] = "URL 为空"
        return result
    
    start = time.time()
    try:
        resp = httpx.get(url, timeout=timeout, follow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0"
        })
        result["response_time_ms"] = int((time.time() - start) * 1000)
        result["status_code"] = resp.status_code
        result["reachable"] = resp.status_code < 500
    except httpx.TimeoutException:
        result["error"] = "请求超时"
        result["response_time_ms"] = timeout * 1000
    except Exception as e:
        result["error"] = str(e)[:200]
    
    return result


def check_source_activity(db, source_id: int, source_name: str, days: int = ALERT_DAYS) -> dict:
    """检查信源最近是否有新文章入库"""
    cutoff = datetime.now() - timedelta(days=days)
    
    recent_count = db.query(func.count(Article.id)).filter(
        Article.source_id == source_id,
        Article.crawled_at >= cutoff
    ).scalar() or 0
    
    # 查找最近一次成功运行
    last_log = db.query(SourceLog).filter(
        SourceLog.source_id == source_id
    ).order_by(SourceLog.created_at.desc()).first()
    
    return {
        "source_id": source_id,
        "source_name": source_name,
        "recent_articles": recent_count,
        "last_run_status": last_log.status if last_log else "unknown",
        "last_run_at": last_log.created_at.isoformat() if last_log else None,
        "last_new_count": last_log.new_count if last_log else 0,
        "is_healthy": recent_count > 0 or (last_log and last_log.status == "success"),
    }


def build_health_report(db) -> dict:
    """生成完整健康报告"""
    from app.models import SourceConfig
    
    sources = db.query(SourceConfig).filter(SourceConfig.is_active == True).all()
    
    report = {
        "generated_at": datetime.now().isoformat(),
        "total_sources": len(sources),
        "check_window_days": ALERT_DAYS,
        "sources": [],
        "summary": {
            "healthy": 0,
            "warning": 0,
            "critical": 0,
            "http_ok": 0,
            "http_fail": 0,
        }
    }
    
    for src in sources:
        # HTTP 检查
        http_check = check_source_http(src.list_url or "")
        
        # 活跃度检查
        activity = check_source_activity(db, src.source_id, src.name, ALERT_DAYS)
        
        # 综合状态
        if http_check["reachable"] and activity["is_healthy"]:
            status = "healthy"
            report["summary"]["healthy"] += 1
        elif not http_check["reachable"]:
            status = "critical"
            report["summary"]["critical"] += 1
        else:
            status = "warning"
            report["summary"]["warning"] += 1
        
        if http_check["reachable"]:
            report["summary"]["http_ok"] += 1
        else:
            report["summary"]["http_fail"] += 1
        
        report["sources"].append({
            "source_id": src.source_id,
            "name": src.name,
            "status": status,
            "http": http_check,
            "activity": activity,
        })
    
    return report


def send_alert(report: dict, webhook_url: str = ALERT_WEBHOOK) -> bool:
    """发送告警到 Webhook"""
    if not webhook_url:
        print("[WARN] 未配置 ALERT_WEBHOOK_URL，跳过告警发送")
        return False
    
    critical = [s for s in report["sources"] if s["status"] == "critical"]
    warning = [s for s in report["sources"] if s["status"] == "warning"]
    
    if not critical and not warning:
        print("[INFO] 所有信源健康，无需告警")
        return True
    
    # 构建飞书/钉钉消息
    msg = {
        "msg_type": "text",
        "content": {
            "text": f"""🚨 出海平台 - 信源健康告警

生成时间: {report['generated_at']}
检查窗口: 最近 {report['check_window_days']} 天

📊 统计:
  健康: {report['summary']['healthy']}
  警告: {report['summary']['warning']}
  严重: {report['summary']['critical']}

❌ 严重异常 ({len(critical)}个):
""" + "\n".join([f"  - {s['name']}: {s['http']['error'] or 'HTTP ' + str(s['http']['status_code'])}" for s in critical]) +
            ("\n\n⚠️ 警告 ({len(warning)}个):\n" + "\n".join([f"  - {s['name']}: 最近{s['activity']['recent_articles']}篇新文章" for s in warning]) if warning else "")
        }
    }
    
    try:
        resp = httpx.post(webhook_url, json=msg, timeout=10)
        return resp.status_code == 200
    except Exception as e:
        print(f"[ERROR] 发送告警失败: {e}")
        return False


def print_report(report: dict):
    """打印文本格式报告"""
    print("\n" + "=" * 70)
    print(f" 信源健康报告 ({report['generated_at']})")
    print("=" * 70)
    
    print(f"\n总计: {report['total_sources']} 个信源 | 检查窗口: {report['check_window_days']} 天")
    print(f"  ✅ 健康: {report['summary']['healthy']}")
    print(f"  ⚠️  警告: {report['summary']['warning']}")
    print(f"  ❌ 严重: {report['summary']['critical']}")
    print(f"  HTTP 正常: {report['summary']['http_ok']} | HTTP 异常: {report['summary']['http_fail']}")
    
    # 严重项
    critical = [s for s in report["sources"] if s["status"] == "critical"]
    if critical:
        print("\n" + "-" * 70)
        print(" 严重异常信源:")
        print("-" * 70)
        for s in critical:
            http = s["http"]
            print(f"  ❌ {s['name']}")
            print(f"     URL: {http['url'][:60]}...")
            print(f"     状态: {http['error'] or http['status_code']}")
            print(f"     响应时间: {http['response_time_ms']}ms")
    
    # 警告项
    warning = [s for s in report["sources"] if s["status"] == "warning"]
    if warning:
        print("\n" + "-" * 70)
        print(" 警告信源（无近期更新）:")
        print("-" * 70)
        for s in warning:
            act = s["activity"]
            print(f"  ⚠️  {s['name']}")
            print(f"     最近{ALERT_DAYS}天新文章: {act['recent_articles']}")
            print(f"     上次运行: {act['last_run_at'] or '未知'}")
            print(f"     上次状态: {act['last_run_status']}")
    
    print("\n" + "=" * 70)


def main():
    parser = argparse.ArgumentParser(description="信源健康监控")
    parser.add_argument("--check-all", action="store_true", help="检查所有信源")
    parser.add_argument("--check-source", type=int, help="检查指定信源ID")
    parser.add_argument("--report", action="store_true", help="生成完整健康报告")
    parser.add_argument("--alert", action="store_true", help="发送告警")
    parser.add_argument("--json", action="store_true", help="输出JSON格式")
    parser.add_argument("--days", type=int, default=ALERT_DAYS, help="检查最近N天")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    
    try:
        if args.check_source:
            from app.models import SourceConfig
            src = db.query(SourceConfig).filter(SourceConfig.source_id == args.check_source).first()
            if not src:
                print(f"[ERROR] 信源ID {args.check_source} 不存在")
                return
            
            http = check_source_http(src.list_url or "")
            activity = check_source_activity(db, src.source_id, src.name, args.days)
            
            print(f"\n信源: {src.name} (ID={src.source_id})")
            print(f"  URL: {src.list_url}")
            print(f"  HTTP: {'✅ 可达' if http['reachable'] else '❌ 不可达'} ({http['status_code']})")
            print(f"  响应时间: {http['response_time_ms']}ms")
            print(f"  最近{args.days}天新文章: {activity['recent_articles']}")
            print(f"  上次运行: {activity['last_run_at'] or '未知'}")
        
        elif args.report or args.check_all or args.alert:
            report = build_health_report(db)
            
            if args.json:
                print(json.dumps(report, ensure_ascii=False, indent=2))
            else:
                print_report(report)
            
            if args.alert:
                send_alert(report)
        
        else:
            parser.print_help()
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
