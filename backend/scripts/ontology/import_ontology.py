#!/usr/bin/env python3
"""
将 PostgreSQL 格式的 migration_output.sql 转换为 SQLite 兼容格式并导入
"""
import sqlite3, json, re
from datetime import datetime

db_path = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"
sql_path = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/ontology_delivery_2/出海本体库交付/migration_output.sql"

def clean_value(v):
    """清理 SQL 值"""
    v = v.strip()
    if v == 'NULL':
        return None
    # 去掉外层引号
    if (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
        v = v[1:-1]
    # 处理转义引号
    v = v.replace("''", "'").replace('\\"', '"')
    return v

def split_sql_values(values_str):
    """安全分割 VALUES 中的字段"""
    parts = []
    i = 0
    current = ""
    in_quote = False
    
    while i < len(values_str):
        c = values_str[i]
        if c == "'":
            if in_quote and i + 1 < len(values_str) and values_str[i+1] == "'":
                current += "'"
                i += 1
            else:
                current += c
                in_quote = not in_quote
        elif c == ',' and not in_quote:
            parts.append(current.strip())
            current = ""
        else:
            current += c
        i += 1
    
    if current.strip():
        parts.append(current.strip())
    return parts

def parse_object_line(line):
    """解析 objects INSERT 行"""
    # 去掉 ::jsonb
    line = line.replace("::jsonb", "")
    
    # 提取 VALUES 括号内的内容
    match = re.search(r"VALUES\((.+)\);?$", line.strip())
    if not match:
        return None
    
    parts = split_sql_values(match.group(1))
    if len(parts) < 9:
        return None
    
    try:
        attrs_str = clean_value(parts[3])
        attrs = json.loads(attrs_str) if attrs_str else {}
        
        return {
            'obj_id': clean_value(parts[0]),
            'obj_type': clean_value(parts[1]),
            'name': clean_value(parts[2]),
            'attributes_json': json.dumps(attrs, ensure_ascii=False),
            'source_libraries': clean_value(parts[4]),
            'source_level': clean_value(parts[5]),
            'conflict_flag': int(parts[6]) if parts[6] else 0,
            'review_status': clean_value(parts[7]),
            'created_at': clean_value(parts[8]),
        }
    except Exception as e:
        print(f"Parse object error: {e} | line[:80]={line[:80]}")
        return None

def parse_relation_line(line):
    """解析 relations INSERT 行"""
    line = line.replace("::jsonb", "")
    
    match = re.search(r"VALUES\((.+)\);?$", line.strip())
    if not match:
        return None
    
    parts = split_sql_values(match.group(1))
    if len(parts) < 11:
        return None
    
    try:
        attrs_str = clean_value(parts[4])
        attrs = json.loads(attrs_str) if attrs_str else {}
        article_id = clean_value(parts[7])
        
        return {
            'rel_id': clean_value(parts[0]),
            'rel_type': clean_value(parts[1]),
            'from_obj': clean_value(parts[2]),
            'to_obj': clean_value(parts[3]),
            'attributes_json': json.dumps(attrs, ensure_ascii=False),
            'confidence': clean_value(parts[5]),
            'source_level': clean_value(parts[6]),
            'source_article_id': int(article_id) if article_id and article_id != 'NULL' else None,
            'conflict_flag': int(parts[8]) if parts[8] else 0,
            'review_status': clean_value(parts[9]),
            'created_at': clean_value(parts[10]),
        }
    except Exception as e:
        print(f"Parse relation error: {e} | line[:80]={line[:80]}")
        return None

def main():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    objects = []
    relations = []
    
    with open(sql_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('--') or line.startswith('SET ') or line.startswith('BEGIN') or line.startswith('COMMIT'):
                continue
            
            if line.startswith("INSERT INTO objects"):
                obj = parse_object_line(line)
                if obj:
                    objects.append(obj)
            elif line.startswith("INSERT INTO relations"):
                rel = parse_relation_line(line)
                if rel:
                    relations.append(rel)
            elif line.startswith("INSERT INTO ontology_bridge"):
                # 桥表数据暂时跳过（SQLite schema 中没有 bridge 表）
                pass
            elif line.startswith("UPDATE objects"):
                # UPDATE 语句也跳过（jsonb_set 不兼容 SQLite）
                pass
    
    print(f"Parsed: {len(objects)} objects, {len(relations)} relations")
    
    # Insert objects
    obj_count = 0
    for obj in objects:
        try:
            cur.execute("""
                INSERT OR IGNORE INTO objects (obj_id, obj_type, name, attributes_json, source_libraries, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                obj['obj_id'], obj['obj_type'], obj['name'],
                obj['attributes_json'], obj['source_libraries'],
                obj['created_at'], obj['created_at']
            ))
            obj_count += 1
        except Exception as e:
            print(f"Insert object error {obj['obj_id']}: {e}")
    
    # Insert relations
    rel_count = 0
    for rel in relations:
        try:
            cur.execute("""
                INSERT OR IGNORE INTO relations (rel_id, rel_type, from_obj, to_obj, attributes_json, source_article_id, confidence, category, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rel['rel_id'], rel['rel_type'], rel['from_obj'], rel['to_obj'],
                rel['attributes_json'], rel.get('source_article_id'),
                rel['confidence'], rel['review_status'],
                rel['created_at'], rel['created_at']
            ))
            rel_count += 1
        except Exception as e:
            print(f"Insert relation error {rel['rel_id']}: {e}")
    
    conn.commit()
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM objects")
    db_obj_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM relations")
    db_rel_count = cur.fetchone()[0]
    
    print(f"\nInserted: {obj_count} objects, {rel_count} relations")
    print(f"DB counts: {db_obj_count} objects, {db_rel_count} relations")
    
    # Stats
    cur.execute("SELECT obj_type, COUNT(*) FROM objects GROUP BY obj_type")
    print("\nObject types:")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]}")
    
    cur.execute("SELECT rel_type, COUNT(*) FROM relations GROUP BY rel_type")
    print("\nRelation types:")
    for r in cur.fetchall():
        print(f"  {r[0]}: {r[1]}")
    
    # Sample
    print("\nSample objects:")
    cur.execute("SELECT obj_id, obj_type, name FROM objects LIMIT 5")
    for r in cur.fetchall():
        print(f"  {r[0]} | {r[1]} | {r[2]}")
    
    print("\nSample relations:")
    cur.execute("SELECT rel_id, rel_type, from_obj, to_obj FROM relations LIMIT 5")
    for r in cur.fetchall():
        print(f"  {r[0]} | {r[1]} | {r[2]} -> {r[3]}")
    
    conn.close()
    print("\n✅ Ontology data import complete!")

if __name__ == "__main__":
    main()
