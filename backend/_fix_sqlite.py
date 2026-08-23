import re

# Fix articles.py
path = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/app/api/articles.py'
with open(path, 'r') as f:
    content = f.read()

old = '''    # 全文搜索
    if q:
        # 使用 PostgreSQL 全文检索
        tsquery = func.plainto_tsquery("chinese", q)
        query = query.filter(
            or_(
                func.to_tsvector("chinese", Article.title).op("@@")(tsquery),
                func.to_tsvector("chinese", func.coalesce(Article.content, "")).op("@@")(tsquery),
                Article.title.ilike(f"%{q}%"),
            )
        )'''

new = '''    # 全文搜索（SQLite 兼容：使用 LIKE）
    if q:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{q}%"),
                Article.content.ilike(f"%{q}%"),
            )
        )'''

if old in content:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print("Fixed articles.py")
else:
    print("articles.py pattern not found")

# Fix search.py
path2 = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/app/api/search.py'
with open(path2, 'r') as f:
    content = f.read()

old2 = '''    # 全文检索
    if q:
        tsquery = func.plainto_tsquery("chinese", q)
        query = query.filter(
            or_(
                func.to_tsvector("chinese", Article.title).op("@@")(tsquery),
                func.to_tsvector("chinese", func.coalesce(Article.content, "")).op("@@")(tsquery),
            )
        )'''

new2 = '''    # 全文检索（SQLite 兼容：使用 LIKE）
    if q:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{q}%"),
                Article.content.ilike(f"%{q}%"),
            )
        )'''

if old2 in content:
    content = content.replace(old2, new2)
    with open(path2, 'w') as f:
        f.write(content)
    print("Fixed search.py")
else:
    print("search.py pattern not found")
