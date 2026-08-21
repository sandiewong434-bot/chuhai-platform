#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite → PostgreSQL 数据迁移脚本
使用方法:
    1. 确保 PostgreSQL 已运行且数据库已创建
    2. 运行 schema.sql 创建表结构
    3. python3 migrate.py --sqlite /path/to/articles.db --pg "postgresql://user:pass@localhost/chuhai"

环境变量:
    SQLITE_PATH     SQLite 数据库路径（默认: 当前目录 articles.db）
    DATABASE_URL    PostgreSQL 连接字符串
"""

import argparse
import os
import sqlite3
from datetime import datetime

import psycopg2
from psycopg2.extras import execute_values


def connect_sqlite(path: str) -> sqlite3.Connection:
    """连接 SQLite 数据库"""
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def connect_postgres(url: str):
    """连接 PostgreSQL 数据库"""
    return psycopg2.connect(url)


def migrate_articles(sqlite_conn, pg_conn, batch_size: int = 500):
    """迁移 articles 表"""
    print("[1/5] 迁移 articles 表...")
    sqlite_cur = sqlite_conn.cursor()

    # 检查 SQLite 表结构（兼容旧版和新版）
    sqlite_cur.execute("PRAGMA table_info(articles)")
    columns = {row[1] for row in sqlite_cur.fetchall()}
    has_content = "content" in columns
    has_category_layer = "category_layer" in columns
    has_category_tag = "category_tag" in columns

    select_cols = "id, source_id, source_name, title, url, publish_date, unique_key, crawled_at, relevance"
    if has_category_layer:
        select_cols += ", category_layer"
    else:
        select_cols += ", NULL as category_layer"
    if has_category_tag:
        select_cols += ", category_tag"
    else:
        select_cols += ", NULL as category_tag"
    if has_content:
        select_cols += ", content"
    else:
        select_cols += ", NULL as content"

    sqlite_cur.execute(f"SELECT {select_cols} FROM articles ORDER BY id")

    pg_cur = pg_conn.cursor()
    total = 0

    while True:
        rows = sqlite_cur.fetchmany(batch_size)
        if not rows:
            break

        values = []
        for row in rows:
            # 处理日期格式
            publish_date = row["publish_date"] if row["publish_date"] else None
            crawled_at = row["crawled_at"]
            # SQLite 的 crawled_at 可能是 YYYY-MM-DD HH:MM:SS 格式
            if crawled_at and len(crawled_at) == 10:  # 只有日期
                crawled_at += " 00:00:00"

            values.append((
                row["source_id"],
                row["source_name"],
                row["title"],
                row["url"],
                publish_date,
                row["unique_key"],
                crawled_at,
                row["relevance"],
                row["category_layer"],
                row["category_tag"],
                row["content"],
            ))

        execute_values(
            pg_cur,
            """
            INSERT INTO articles (source_id, source_name, title, url, publish_date,
                                  unique_key, crawled_at, relevance, category_layer,
                                  category_tag, content)
            VALUES %s
            ON CONFLICT (unique_key) DO NOTHING
            """,
            values,
            page_size=batch_size,
        )
        pg_conn.commit()
        total += len(values)
        print(f"  已迁移 {total} 条 articles...")

    print(f"[1/5] ✓ articles 表迁移完成，共 {total} 条")
    pg_cur.close()


def migrate_objects(sqlite_conn, pg_conn):
    """迁移 objects 表"""
    print("[2/5] 迁移 objects 表...")
    sqlite_cur = sqlite_conn.cursor()

    # 检查 objects 表是否存在
    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='objects'")
    if not sqlite_cur.fetchone():
        print("  SQLite 中无 objects 表，跳过")
        return

    sqlite_cur.execute("SELECT obj_id, obj_type, name, attributes_json, source_libraries FROM objects")
    rows = sqlite_cur.fetchall()

    if not rows:
        print("  objects 表为空，跳过")
        return

    pg_cur = pg_conn.cursor()
    for row in rows:
        pg_cur.execute(
            """
            INSERT INTO objects (obj_id, obj_type, name, attributes_json, source_libraries)
            VALUES (%s, %s, %s, %s::jsonb, %s)
            ON CONFLICT (obj_id) DO NOTHING
            """,
            (row["obj_id"], row["obj_type"], row["name"],
             row["attributes_json"] or '{}', row["source_libraries"]),
        )
    pg_conn.commit()
    pg_cur.close()
    print(f"[2/5] ✓ objects 表迁移完成，共 {len(rows)} 条")


def migrate_relations(sqlite_conn, pg_conn):
    """迁移 relations 表"""
    print("[3/5] 迁移 relations 表...")
    sqlite_cur = sqlite_conn.cursor()

    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='relations'")
    if not sqlite_cur.fetchone():
        print("  SQLite 中无 relations 表，跳过")
        return

    sqlite_cur.execute(
        "SELECT rel_id, rel_type, from_obj, to_obj, attributes_json, source_article_id, confidence FROM relations"
    )
    rows = sqlite_cur.fetchall()

    if not rows:
        print("  relations 表为空，跳过")
        return

    pg_cur = pg_conn.cursor()
    for row in rows:
        pg_cur.execute(
            """
            INSERT INTO relations (rel_id, rel_type, from_obj, to_obj, attributes_json,
                                   source_article_id, confidence)
            VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s)
            ON CONFLICT (rel_id) DO NOTHING
            """,
            (row["rel_id"], row["rel_type"], row["from_obj"], row["to_obj"],
             row["attributes_json"] or '{}', row["source_article_id"], row["confidence"]),
        )
    pg_conn.commit()
    pg_cur.close()
    print(f"[3/5] ✓ relations 表迁移完成，共 {len(rows)} 条")


def migrate_article_content(sqlite_conn, pg_conn, batch_size: int = 500):
    """迁移 article_content 表到 articles.content 字段"""
    print("[4/5] 迁移 article_content 正文...")
    sqlite_cur = sqlite_conn.cursor()

    sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='article_content'")
    if not sqlite_cur.fetchone():
        print("  SQLite 中无 article_content 表，跳过")
        return

    sqlite_cur.execute("SELECT article_id, content FROM article_content WHERE content IS NOT NULL AND content != ''")

    pg_cur = pg_conn.cursor()
    total = 0

    while True:
        rows = sqlite_cur.fetchmany(batch_size)
        if not rows:
            break

        for row in rows:
            # 通过 SQLite 的 article_id 找到对应的 unique_key，再更新 PG
            sqlite_cur2 = sqlite_conn.cursor()
            sqlite_cur2.execute("SELECT unique_key FROM articles WHERE id = ?", (row["article_id"],))
            uk_row = sqlite_cur2.fetchone()
            if not uk_row:
                continue
            unique_key = uk_row["unique_key"]

            pg_cur.execute(
                "UPDATE articles SET content = %s WHERE unique_key = %s AND content IS NULL",
                (row["content"], unique_key),
            )
            total += pg_cur.rowcount

        pg_conn.commit()
        print(f"  已回填 {total} 条正文...")

    pg_cur.close()
    print(f"[4/5] ✓ article_content 正文迁移完成，共回填 {total} 条")


def migrate_sources_json(sqlite_conn, pg_conn, sources_json_path: str):
    """从 sources.json 导入信源配置到 PostgreSQL"""
    print("[5/5] 迁移 sources.json 信源配置...")
    import json

    if not os.path.exists(sources_json_path):
        print(f"  未找到 {sources_json_path}，跳过")
        return

    with open(sources_json_path, encoding="utf-8") as f:
        data = json.load(f)

    sources = data.get("sources", [])
    if not sources:
        print("  sources.json 中无信源配置，跳过")
        return

    pg_cur = pg_conn.cursor()
    count = 0
    for s in sources:
        pg_cur.execute(
            """
            INSERT INTO sources (source_id, name, org_type, column_name, list_url,
                                 content_format, access_method, unique_id_rule,
                                 access_restriction, update_freq, target_db,
                                 nev_relevance, authority, compliance, crawl_tier,
                                 library, category_layer, category_tag, network_issue,
                                 selectors, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
            ON CONFLICT (source_id) DO UPDATE SET
                name = EXCLUDED.name,
                selectors = EXCLUDED.selectors,
                is_active = EXCLUDED.is_active,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                s.get("id"),
                s.get("name"),
                s.get("org_type"),
                s.get("column"),
                s.get("list_url"),
                s.get("content_format"),
                s.get("access_method"),
                s.get("unique_id_rule"),
                s.get("access_restriction"),
                s.get("update_freq"),
                s.get("target_db"),
                s.get("nev_relevance"),
                s.get("authority"),
                s.get("compliance"),
                s.get("crawl_tier"),
                s.get("library"),
                s.get("category_layer"),
                s.get("category_tag"),
                s.get("network_issue", False),
                json.dumps(s.get("selectors", {})),
                not s.get("network_issue", False),
            ),
        )
        count += 1

    pg_conn.commit()
    pg_cur.close()
    print(f"[5/5] ✓ sources.json 信源配置导入完成，共 {count} 个")


def verify_migration(pg_conn):
    """验证迁移结果"""
    print("\n=== 迁移验证 ===")
    pg_cur = pg_conn.cursor()

    tables = ["articles", "objects", "relations", "source_logs", "sources"]
    for table in tables:
        pg_cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = pg_cur.fetchone()[0]
        print(f"  {table}: {count} 条")

    pg_cur.execute("SELECT COUNT(*) FROM articles WHERE content IS NOT NULL AND content != ''")
    content_count = pg_cur.fetchone()[0]
    print(f"  articles（含正文）: {content_count} 条")

    pg_cur.close()
    print("=== 验证完成 ===")


def main():
    parser = argparse.ArgumentParser(description="SQLite → PostgreSQL 数据迁移")
    parser.add_argument("--sqlite", default=os.getenv("SQLITE_PATH", "articles.db"),
                        help="SQLite 数据库路径")
    parser.add_argument("--pg", default=os.getenv("DATABASE_URL"),
                        help="PostgreSQL 连接字符串，如 postgresql://user:pass@localhost/chuhai")
    parser.add_argument("--sources", default="sources.json",
                        help="sources.json 路径")
    parser.add_argument("--batch-size", type=int, default=500,
                        help="批量插入大小")
    args = parser.parse_args()

    if not args.pg:
        print("错误: 请通过 --pg 参数或 DATABASE_URL 环境变量指定 PostgreSQL 连接字符串")
        print("示例: python3 migrate.py --pg 'postgresql://chuhai:password@localhost:5432/chuhai'")
        exit(1)

    if not os.path.exists(args.sqlite):
        print(f"错误: SQLite 数据库不存在: {args.sqlite}")
        exit(1)

    print(f"SQLite: {args.sqlite}")
    print(f"PostgreSQL: {args.pg.replace('://', '://***:***@')}")
    print(f"sources.json: {args.sources}")
    print("=" * 50)

    sqlite_conn = connect_sqlite(args.sqlite)
    pg_conn = connect_postgres(args.pg)

    try:
        migrate_articles(sqlite_conn, pg_conn, args.batch_size)
        migrate_objects(sqlite_conn, pg_conn)
        migrate_relations(sqlite_conn, pg_conn)
        migrate_article_content(sqlite_conn, pg_conn, args.batch_size)
        migrate_sources_json(sqlite_conn, pg_conn, args.sources)
        verify_migration(pg_conn)
        print("\n✅ 迁移完成！")
    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        pg_conn.rollback()
        raise
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()
