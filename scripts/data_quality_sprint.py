#!/usr/bin/env python3
"""数据质量冲刺脚本 - 去重 + 正文补全"""

import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "backend" / "chuhai_dev.db"

def deduplicate_articles():
    """删除重复文章，保留最新的一篇"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # 查找重复URL
    c.execute('''
        SELECT url, COUNT(*) as cnt, GROUP_CONCAT(id) as ids,
               MAX(crawled_at) as latest
        FROM articles
        GROUP BY url
        HAVING cnt > 1
    ''')
    duplicates = c.fetchall()
    
    deleted = 0
    for row in duplicates:
        url = row['url']
        ids = [int(x) for x in row['ids'].split(',')]
        latest = row['latest']
        
        # 保留最新的一篇，删除其他的
        c.execute('SELECT id FROM articles WHERE url = ? AND crawled_at = ?', (url, latest))
        keep = c.fetchone()['id']
        
        to_delete = [i for i in ids if i != keep]
        for del_id in to_delete:
            c.execute('DELETE FROM articles WHERE id = ?', (del_id,))
            deleted += 1
            print(f"  删除重复文章 ID={del_id}, URL={url[:60]}...")
    
    conn.commit()
    conn.close()
    return deleted

def find_missing_content():
    """找出缺少正文的文章"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''
        SELECT id, title, source_name, url
        FROM articles
        WHERE content IS NULL OR content = ''
        ORDER BY id
    ''')
    
    missing = c.fetchall()
    conn.close()
    return missing

def main():
    print("=== 数据质量冲刺 ===\n")
    
    # 1. 去重
    print("[1/2] 文章去重...")
    deleted = deduplicate_articles()
    if deleted:
        print(f"  ✅ 删除 {deleted} 篇重复文章\n")
    else:
        print("  ✅ 未发现重复文章\n")
    
    # 2. 检查缺少正文
    print("[2/2] 检查缺少正文的文章...")
    missing = find_missing_content()
    if missing:
        print(f"  ⚠️ 发现 {len(missing)} 篇文章缺少正文:")
        for row in missing:
            print(f"    ID={row['id']} | {row['source_name']} | {row['title'][:40]}")
        print(f"\n  建议: 使用爬虫重新抓取这些文章的完整内容")
    else:
        print("  ✅ 所有文章都有正文\n")
    
    # 统计
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM articles')
    total = c.fetchone()[0]
    c.execute('SELECT COUNT(*) FROM articles WHERE content IS NOT NULL AND content != ""')
    with_content = c.fetchone()[0]
    c.execute('SELECT COUNT(DISTINCT url) FROM articles')
    unique_urls = c.fetchone()[0]
    conn.close()
    
    print("\n=== 数据质量报告 ===")
    print(f"  总文章数: {total}")
    print(f"  唯一URL数: {unique_urls}")
    print(f"  有正文: {with_content} ({with_content/total*100:.1f}%)")
    print(f"  无正文: {total - with_content}")

if __name__ == "__main__":
    main()
