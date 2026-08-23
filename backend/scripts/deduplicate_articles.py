#!/usr/bin/env python3
"""
文章去重脚本
按标题去重，保留内容最长、信息最完整的一篇
"""
import sqlite3
from datetime import datetime

DB_PATH = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def deduplicate_by_title():
    """按标题去重，保留内容最长的一篇"""
    conn = connect_db()
    c = conn.cursor()

    # 获取所有按标题分组的文章
    c.execute("""
        SELECT title, COUNT(*) as cnt, GROUP_CONCAT(id) as ids,
               GROUP_CONCAT(LENGTH(COALESCE(content, ''))) as content_lens
        FROM articles
        GROUP BY title
        HAVING cnt > 1
        ORDER BY cnt DESC
    """)
    duplicates = c.fetchall()

    total_duplicates = 0
    to_delete = []

    for dup in duplicates:
        title = dup["title"]
        ids = [int(x) for x in dup["ids"].split(",")]
        lens = [int(x) for x in dup["content_lens"].split(",")]

        # 找到内容最长的一篇的索引
        max_len_idx = lens.index(max(lens))
        keep_id = ids[max_len_idx]
        delete_ids = [id for i, id in enumerate(ids) if i != max_len_idx]

        to_delete.extend(delete_ids)
        total_duplicates += len(delete_ids)

        print(f"  '{title[:50]}...' 重复 {dup['cnt']} 篇，保留 ID={keep_id}(内容{max(lens)}字)，删除 {delete_ids}")

    if not to_delete:
        print("  未发现重复文章")
        conn.close()
        return 0

    # 删除重复文章
    # 先删除关联的 relations（避免外键问题，虽然当前没有外键约束）
    print(f"\n  清理关联数据...")
    c.execute(f"""
        DELETE FROM relations WHERE source_article_id IN ({','.join('?' * len(to_delete))})
    """, to_delete)
    rel_deleted = c.rowcount
    print(f"    删除 {rel_deleted} 条关联关系")

    # 删除重复文章
    print(f"\n  删除重复文章...")
    c.execute(f"""
        DELETE FROM articles WHERE id IN ({','.join('?' * len(to_delete))})
    """, to_delete)
    articles_deleted = c.rowcount
    print(f"    删除 {articles_deleted} 篇重复文章")

    conn.commit()
    conn.close()
    return articles_deleted


def generate_stats_after():
    """去重后统计"""
    conn = connect_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM articles")
    total = c.fetchone()[0]

    c.execute("SELECT COUNT(DISTINCT title) FROM articles")
    unique_titles = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM relations")
    rel_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM objects")
    obj_count = c.fetchone()[0]

    conn.close()

    return {
        "total": total,
        "unique_titles": unique_titles,
        "relations": rel_count,
        "objects": obj_count,
    }


def main():
    print("=" * 60)
    print("文章去重")
    print("=" * 60)

    # 去重前统计
    before = generate_stats_after()
    print(f"\n去重前:")
    print(f"  总文章: {before['total']}")
    print(f"  唯一标题: {before['unique_titles']}")
    print(f"  重复数: {before['total'] - before['unique_titles']}")

    # 执行去重
    print(f"\n执行去重...")
    deleted = deduplicate_by_title()

    # 去重后统计
    after = generate_stats_after()
    print(f"\n去重后:")
    print(f"  总文章: {after['total']}")
    print(f"  唯一标题: {after['unique_titles']}")
    print(f"  删除文章: {deleted}")
    print(f"  剩余关系: {after['relations']}")
    print(f"  剩余实体: {after['objects']}")

    print(f"\n{'='*60}")
    print("文章去重完成！")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
