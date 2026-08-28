import sqlite3
import re
from datetime import datetime

DB_PATH = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db'

def extract_date_from_url(url):
    """从URL中提取日期"""
    if not url:
        return None
    
    # 模式1: /2026/08/22/ 或 /2026-08-22/
    m = re.search(r'/(\d{4})[/-](\d{2})[/-](\d{2})/', url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    
    # 模式2: /20260822/
    m = re.search(r'/(\d{4})(\d{2})(\d{2})/', url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    
    # 模式3: /art/2026/art_xxx (miit.gov.cn 等)
    m = re.search(r'/(\d{4})/art[_\d]', url)
    if m:
        year = m.group(1)
        # 尝试从后面的路径找月份
        m2 = re.search(r'/(\d{4})/(\d{2})/', url)
        if m2:
            return f"{year}-{m2.group(2)}-01"
        return f"{year}-01-01"
    
    # 模式4: 2026-08-22.html
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})\.', url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    
    return None

def extract_date_from_content(content):
    """从正文中提取日期"""
    if not content:
        return None
    
    # 模式1: 2026年8月22日
    m = re.search(r'(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日', content)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    
    # 模式2: 2026-08-22 或 2026/08/22
    m = re.search(r'(\d{4})[-/](\d{2})[-/](\d{2})', content)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    
    # 模式3: 发布时间：2026-08-22
    m = re.search(r'发布时间[：:]\s*(\d{4})[-年](\d{1,2})[-月](\d{1,2})', content)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    
    return None

def extract_date_from_title(title):
    """从标题中提取日期"""
    if not title:
        return None
    
    # 2026年8月22日
    m = re.search(r'(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日', title)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    
    return None

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 获取所有无日期的文章
    no_date_articles = c.execute(
        "SELECT id, title, url, content, crawled_at, source_name FROM articles WHERE publish_date IS NULL"
    ).fetchall()
    
    print(f"待补全日期的文章: {len(no_date_articles)} 篇")
    print()
    
    url_success = 0
    content_success = 0
    title_success = 0
    crawled_fallback = 0
    still_missing = 0
    
    updates = []
    
    for id_, title, url, content, crawled_at, source_name in no_date_articles:
        extracted_date = None
        source = None
        
        # 优先级1: URL提取
        extracted_date = extract_date_from_url(url)
        if extracted_date:
            source = "url"
            url_success += 1
        
        # 优先级2: 正文提取
        if not extracted_date and content:
            extracted_date = extract_date_from_content(content)
            if extracted_date:
                source = "content"
                content_success += 1
        
        # 优先级3: 标题提取
        if not extracted_date:
            extracted_date = extract_date_from_title(title)
            if extracted_date:
                source = "title"
                title_success += 1
        
        # 优先级4: crawled_at 回退
        if not extracted_date and crawled_at:
            try:
                dt = datetime.fromisoformat(crawled_at.replace('Z', '+00:00'))
                extracted_date = dt.strftime('%Y-%m-%d')
                source = "crawled_at"
                crawled_fallback += 1
            except:
                pass
        
        if extracted_date:
            updates.append((extracted_date, id_))
            if len(updates) <= 10:
                print(f"  [{id_:>3}] {source:12s} → {extracted_date} | {source_name}: {title[:40]}...")
        else:
            still_missing += 1
            if still_missing <= 5:
                print(f"  [{id_:>3}] {'未找到':12s} → ??? | {source_name}: {title[:40]}...")
    
    print()
    print(f"URL提取成功: {url_success}")
    print(f"正文提取成功: {content_success}")
    print(f"标题提取成功: {title_success}")
    print(f"crawled_at回退: {crawled_fallback}")
    print(f"仍然缺失: {still_missing}")
    print(f"总计可补全: {len(updates)}")
    
    if updates:
        print()
        print(f"正在执行更新... ({len(updates)} 篇文章)")
        c.executemany("UPDATE articles SET publish_date = ? WHERE id = ?", updates)
        conn.commit()
        print(f"已更新 {len(updates)} 篇文章的发布日期")
        print()
        confirm = input(f"是否执行更新？({len(updates)} 篇文章) [y/N]: ")
        if confirm.lower() == 'y':
            c.executemany("UPDATE articles SET publish_date = ? WHERE id = ?", updates)
            conn.commit()
            print(f"已更新 {len(updates)} 篇文章的发布日期")
        else:
            print("已取消更新")
    
    conn.close()

if __name__ == '__main__':
    main()
