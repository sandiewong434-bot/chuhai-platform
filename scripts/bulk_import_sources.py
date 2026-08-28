#!/usr/bin/env python3
"""
信源批量导入工具
支持从 CSV / JSON 批量导入新信源，方便信源收集人员使用

用法:
    python scripts/bulk_import_sources.py --file sources.csv [--dry-run]
    python scripts/bulk_import_sources.py --file sources.json [--dry-run]
    python scripts/bulk_import_sources.py --template csv  # 生成CSV模板
    python scripts/bulk_import_sources.py --template json # 生成JSON模板
"""

import argparse
import csv
import json
import sys
import os
from datetime import datetime
from pathlib import Path

# 添加backend到路径
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_PATH = Path(__file__).parent.parent / "backend" / "chuhai_dev.db"

# 必填字段
REQUIRED_FIELDS = ["name", "list_url", "target_db"]

# 可选字段及默认值
OPTIONAL_DEFAULTS = {
    "org_type": "",
    "column_name": "",
    "content_format": "网页HTML",
    "access_method": "网页抓取",
    "unique_id_rule": "",
    "access_restriction": "访问正常",
    "update_freq": "每日",
    "nev_relevance": "间接相关",
    "authority": "2级 一般可靠",
    "compliance": "公开发布可自由引用",
    "crawl_tier": "auto_html",
    "library": "",
    "category_layer": "",
    "category_tag": "",
    "network_issue": False,
    "selectors": {},
    "is_active": True,
    "status": "active",
}

# 有效值校验
VALID_ORG_TYPES = ["政府/监管机构", "国际组织", "行业协会", "研究机构", "媒体/智库", "企业", "商协会", "其他", ""]
VALID_CONTENT_FORMATS = ["网页HTML", "PDF", "API/JSON", "RSS", "Word", "Excel", ""]
VALID_ACCESS_METHODS = ["网页抓取", "API调用", "RSS订阅", "手动录入", ""]
VALID_NEV_RELEVANCE = ["直接相关", "间接相关", "不相关", ""]
VALID_AUTHORITIES = ["1级 高度可靠", "2级 一般可靠", "3级 需交叉验证", ""]
VALID_UPDATE_FREQS = ["实时", "每日", "每周", "每月", "不定期", ""]
VALID_CRAWL_TIERS = ["auto_html", "auto_api", "auto_pdf", "manual", ""]
VALID_STATUSES = ["active", "inactive", "error", "pending"]


def validate_record(record: dict, row_num: int) -> list:
    """校验单条记录，返回错误列表"""
    errors = []
    
    # 必填检查
    for field in REQUIRED_FIELDS:
        if not record.get(field) or str(record.get(field)).strip() == "":
            errors.append(f"第{row_num}行: 缺少必填字段 '{field}'")
    
    # URL格式检查
    url = record.get("list_url", "")
    if url and not (url.startswith("http://") or url.startswith("https://")):
        errors.append(f"第{row_num}行: list_url 必须以 http:// 或 https:// 开头")
    
    # 枚举值校验
    if record.get("org_type") and record.get("org_type") not in VALID_ORG_TYPES:
        errors.append(f"第{row_num}行: org_type 值无效: {record.get('org_type')}")
    
    if record.get("content_format") and record.get("content_format") not in VALID_CONTENT_FORMATS:
        errors.append(f"第{row_num}行: content_format 值无效: {record.get('content_format')}")
    
    if record.get("access_method") and record.get("access_method") not in VALID_ACCESS_METHODS:
        errors.append(f"第{row_num}行: access_method 值无效: {record.get('access_method')}")
    
    if record.get("nev_relevance") and record.get("nev_relevance") not in VALID_NEV_RELEVANCE:
        errors.append(f"第{row_num}行: nev_relevance 值无效: {record.get('nev_relevance')}")
    
    if record.get("authority") and record.get("authority") not in VALID_AUTHORITIES:
        errors.append(f"第{row_num}行: authority 值无效: {record.get('authority')}")
    
    if record.get("update_freq") and record.get("update_freq") not in VALID_UPDATE_FREQS:
        errors.append(f"第{row_num}行: update_freq 值无效: {record.get('update_freq')}")
    
    if record.get("crawl_tier") and record.get("crawl_tier") not in VALID_CRAWL_TIERS:
        errors.append(f"第{row_num}行: crawl_tier 值无效: {record.get('crawl_tier')}")
    
    if record.get("status") and record.get("status") not in VALID_STATUSES:
        errors.append(f"第{row_num}行: status 值无效: {record.get('status')}")
    
    return errors


def normalize_record(record: dict) -> dict:
    """规范化记录，填充默认值"""
    normalized = {}
    
    # 处理布尔值
    for key in ["network_issue", "is_active"]:
        val = record.get(key, OPTIONAL_DEFAULTS.get(key, False))
        if isinstance(val, str):
            normalized[key] = val.lower() in ("true", "1", "yes", "是")
        else:
            normalized[key] = bool(val) if val is not None else OPTIONAL_DEFAULTS.get(key, False)
    
    # 处理selectors (JSON)
    selectors = record.get("selectors", OPTIONAL_DEFAULTS.get("selectors", {}))
    if isinstance(selectors, str):
        try:
            selectors = json.loads(selectors) if selectors.strip() else {}
        except json.JSONDecodeError:
            selectors = {}
    normalized["selectors"] = json.dumps(selectors, ensure_ascii=False) if selectors else "{}"
    
    # 处理其他字段
    for key in ["name", "org_type", "column_name", "list_url", "content_format",
                "access_method", "unique_id_rule", "access_restriction", "update_freq",
                "target_db", "nev_relevance", "authority", "compliance", "crawl_tier",
                "library", "category_layer", "category_tag", "status"]:
        normalized[key] = str(record.get(key, OPTIONAL_DEFAULTS.get(key, ""))).strip()
    
    return normalized


def get_next_source_id(session) -> int:
    """获取下一个source_id"""
    result = session.execute(text("SELECT MAX(source_id) FROM sources"))
    max_id = result.scalar()
    return (max_id or 0) + 1


def import_sources(records: list, dry_run: bool = False) -> dict:
    """导入信源记录"""
    engine = create_engine(f"sqlite:///{DB_PATH}")
    Session = sessionmaker(bind=engine)
    session = Session()
    
    all_errors = []
    valid_records = []
    
    # 校验所有记录
    for i, record in enumerate(records, start=1):
        errors = validate_record(record, i)
        if errors:
            all_errors.extend(errors)
        else:
            valid_records.append(normalize_record(record))
    
    if all_errors:
        print(f"\n❌ 发现 {len(all_errors)} 个错误:")
        for err in all_errors[:20]:  # 最多显示20条
            print(f"  - {err}")
        if len(all_errors) > 20:
            print(f"  ... 还有 {len(all_errors) - 20} 个错误")
        print()
    
    if not valid_records:
        print("没有有效记录可导入")
        return {"success": 0, "failed": len(records), "errors": all_errors}
    
    if dry_run:
        print(f"\n🔍 干运行模式 - 将导入 {len(valid_records)} 条记录 (共 {len(records)} 条):")
        for i, rec in enumerate(valid_records[:5], 1):
            print(f"  {i}. {rec['name']} | {rec['target_db']} | {rec['list_url'][:60]}...")
        if len(valid_records) > 5:
            print(f"  ... 还有 {len(valid_records) - 5} 条")
        return {"success": 0, "failed": 0, "dry_run": True, "would_import": len(valid_records)}
    
    # 实际导入
    next_id = get_next_source_id(session)
    inserted = 0
    now = datetime.now().isoformat()
    
    try:
        for rec in valid_records:
            rec["source_id"] = next_id
            rec["created_at"] = now
            rec["updated_at"] = now
            next_id += 1
            
            session.execute(text("""
                INSERT INTO sources (
                    source_id, name, org_type, column_name, list_url, content_format,
                    access_method, unique_id_rule, access_restriction, update_freq,
                    target_db, nev_relevance, authority, compliance, crawl_tier,
                    library, category_layer, category_tag, network_issue, selectors,
                    is_active, created_at, updated_at, status
                ) VALUES (
                    :source_id, :name, :org_type, :column_name, :list_url, :content_format,
                    :access_method, :unique_id_rule, :access_restriction, :update_freq,
                    :target_db, :nev_relevance, :authority, :compliance, :crawl_tier,
                    :library, :category_layer, :category_tag, :network_issue, :selectors,
                    :is_active, :created_at, :updated_at, :status
                )
            """), rec)
            inserted += 1
        
        session.commit()
        print(f"\n✅ 成功导入 {inserted} 条信源记录")
        print(f"   信源ID范围: {next_id - inserted} ~ {next_id - 1}")
        
        # 显示导入摘要
        libs = {}
        for rec in valid_records:
            lib = rec.get("library", "未分类")
            libs[lib] = libs.get(lib, 0) + 1
        print(f"\n   按库分布:")
        for lib, count in sorted(libs.items()):
            print(f"     - {lib}: {count}")
        
        return {"success": inserted, "failed": len(records) - inserted, "errors": all_errors}
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ 导入失败: {e}")
        return {"success": 0, "failed": len(records), "errors": [str(e)]}
    finally:
        session.close()


def parse_csv(file_path: str) -> list:
    """解析CSV文件"""
    records = []
    with open(file_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 清理空值
            cleaned = {k: v.strip() if v else "" for k, v in row.items()}
            records.append(cleaned)
    return records


def parse_json(file_path: str) -> list:
    """解析JSON文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict) and "sources" in data:
        return data["sources"]
    elif isinstance(data, list):
        return data
    else:
        raise ValueError("JSON格式错误: 应为对象数组或包含'sources'键的对象")


def generate_template(format_type: str):
    """生成导入模板"""
    template = {
        "sources": [
            {
                "name": "示例信源名称",
                "org_type": "政府/监管机构",
                "column_name": "政策发布",
                "list_url": "https://example.gov.cn/policy/",
                "content_format": "网页HTML",
                "access_method": "网页抓取",
                "unique_id_rule": "公告文号",
                "access_restriction": "访问正常",
                "update_freq": "每日",
                "target_db": "A 政策法规库",
                "nev_relevance": "间接相关",
                "authority": "1级 高度可靠",
                "compliance": "公开发布可自由引用",
                "crawl_tier": "auto_html",
                "library": "A-政策法规库",
                "category_layer": "",
                "category_tag": "",
                "network_issue": False,
                "selectors": {},
                "is_active": True,
                "status": "active"
            }
        ]
    }
    
    if format_type == "json":
        output = "sources_template.json"
        with open(output, "w", encoding="utf-8") as f:
            json.dump(template, f, ensure_ascii=False, indent=2)
    else:
        output = "sources_template.csv"
        # 获取所有字段
        all_fields = list(template["sources"][0].keys())
        with open(output, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=all_fields)
            writer.writeheader()
            writer.writerow({k: str(v) for k, v in template["sources"][0].items()})
    
    print(f"✅ 模板已生成: {output}")
    print(f"   请按此格式填写后导入")


def main():
    parser = argparse.ArgumentParser(description="信源批量导入工具")
    parser.add_argument("--file", help="要导入的CSV或JSON文件路径")
    parser.add_argument("--template", choices=["csv", "json"], help="生成导入模板")
    parser.add_argument("--dry-run", action="store_true", help="干运行，不实际写入数据库")
    
    args = parser.parse_args()
    
    if args.template:
        generate_template(args.template)
        return
    
    if not args.file:
        parser.print_help()
        sys.exit(1)
    
    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        sys.exit(1)
    
    # 根据扩展名解析
    ext = os.path.splitext(args.file)[1].lower()
    try:
        if ext == ".csv":
            records = parse_csv(args.file)
        elif ext == ".json":
            records = parse_json(args.file)
        else:
            print(f"❌ 不支持的文件格式: {ext}，请使用 .csv 或 .json")
            sys.exit(1)
    except Exception as e:
        print(f"❌ 解析文件失败: {e}")
        sys.exit(1)
    
    print(f"\n📂 从 {args.file} 读取到 {len(records)} 条记录")
    
    result = import_sources(records, dry_run=args.dry_run)
    
    # 退出码
    if result.get("failed", 0) > 0 and result.get("success", 0) == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
