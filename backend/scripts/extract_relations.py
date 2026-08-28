import sqlite3
import re
import json
import uuid
from datetime import datetime

DB_PATH = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db'

# 已知企业列表（从objects表获取）
# 已知国家列表（从objects表获取）
# 关系关键词映射
RELATION_PATTERNS = [
    # (正则模式, 关系类型)
    (r'(.+?)\s*(?:在|于|向|对)\s*(.+?)\s*(?:投资|建厂|设厂|布局)', '投资建厂'),
    (r'(.+?)\s*(?:出口|销往|交付|进军|进入)\s*(.+?)(?:市场|地区|国家)', '出口到'),
    (r'(.+?)\s*(?:与|和)\s*(.+?)\s*(?:合作|合资|战略|签约|协议)', '战略合作'),
    (r'(.+?)\s*(?:收购|并购|入股)\s*(.+?)', '收购'),
    (r'(.+?)\s*(?:获|获得|拿下)\s*(.+?)\s*(?:订单|项目|合同)', '获得订单'),
    (r'(.+?)\s*(?:在|于)\s*(.+?)\s*(?:销量|销售|交付|产量)', '销量数据'),
    (r'(.+?)\s*(?:发布|推出|上市)\s*(.+?)(?:车型|产品|电池)', '产品发布'),
]

def load_known_entities():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    enterprises = [row[0] for row in c.execute("SELECT name FROM objects WHERE obj_type='企业'").fetchall()]
    countries = [row[0] for row in c.execute("SELECT name FROM objects WHERE obj_type='目的国'").fetchall()]
    products = [row[0] for row in c.execute("SELECT name FROM objects WHERE obj_type='产品'").fetchall()]
    
    conn.close()
    return enterprises, countries, products

def extract_relations_from_text(text, article_id, enterprises, countries, products):
    """从正文中提取关系"""
    relations = []
    if not text:
        return relations
    
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if len(line) < 10:
            continue
        
        # 方法1: 找包含企业和国家的句子
        found_ents = [e for e in enterprises if e in line]
        found_countries = [c for c in countries if c in line]
        
        if found_ents and found_countries:
            for ent in found_ents[:2]:  # 限制每句最多2个企业
                for country in found_countries[:2]:  # 限制每句最多2个国家
                    # 判断关系类型
                    rel_type = '出海动态'
                    if any(kw in line for kw in ['投资', '建厂', '设厂', '产能']):
                        rel_type = '投资建厂'
                    elif any(kw in line for kw in ['出口', '销量', '交付', '销售']):
                        rel_type = '销量数据'
                    elif any(kw in line for kw in ['合作', '合资', '战略', '签约']):
                        rel_type = '战略合作'
                    elif any(kw in line for kw in ['收购', '并购']):
                        rel_type = '收购'
                    
                    relations.append({
                        'rel_type': rel_type,
                        'from_obj': ent,
                        'to_obj': country,
                        'source_article_id': article_id,
                        'confidence': '低',
                        'attributes_json': json.dumps({'抽取方式': '正文规则匹配', '原文': line[:100]})
                    })
    
    return relations

def extract_relations_from_title(title, article_id, enterprises, countries):
    """从标题中提取关系"""
    relations = []
    if not title:
        return relations
    
    found_ents = [e for e in enterprises if e in title]
    found_countries = [c for c in countries if c in title]
    
    if found_ents and found_countries:
        for ent in found_ents[:1]:
            for country in found_countries[:1]:
                rel_type = '出海动态'
                if any(kw in title for kw in ['投资', '建厂', '设厂']):
                    rel_type = '投资建厂'
                elif any(kw in title for kw in ['出口', '销量', '交付']):
                    rel_type = '销量数据'
                elif any(kw in title for kw in ['合作', '合资', '战略']):
                    rel_type = '战略合作'
                
                relations.append({
                    'rel_type': rel_type,
                    'from_obj': ent,
                    'to_obj': country,
                    'source_article_id': article_id,
                    'confidence': '中',
                    'attributes_json': json.dumps({'抽取方式': '标题关键词匹配'})
                })
    
    return relations

def main():
    enterprises, countries, products = load_known_entities()
    print(f'已知企业: {len(enterprises)}个')
    print(f'已知国家: {len(countries)}个')
    print(f'已知产品: {len(products)}个')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 获取已有关系的article_id
    existing_articles = set(row[0] for row in c.execute('SELECT DISTINCT source_article_id FROM relations').fetchall())
    print(f'已有关系的文章: {len(existing_articles)}篇')
    
    # 获取有正文但没有关系的文章
    articles = c.execute('''
        SELECT id, title, content FROM articles 
        WHERE content IS NOT NULL AND LENGTH(content) > 50
        AND id NOT IN (SELECT DISTINCT source_article_id FROM relations)
    ''').fetchall()
    
    print(f'待抽取关系的文章: {len(articles)}篇')
    
    all_relations = []
    
    for article_id, title, content in articles:
        # 标题抽取
        rels = extract_relations_from_title(title, article_id, enterprises, countries)
        all_relations.extend(rels)
        
        # 正文抽取（如果标题没抽到）
        if not rels:
            rels = extract_relations_from_text(content, article_id, enterprises, countries, products)
            all_relations.extend(rels)
    
    print(f'新抽取关系: {len(all_relations)}条')
    
    # 去重
    seen = set()
    unique_relations = []
    for r in all_relations:
        key = (r['from_obj'], r['to_obj'], r['rel_type'], r['source_article_id'])
        if key not in seen:
            seen.add(key)
            unique_relations.append(r)
    
    print(f'去重后: {len(unique_relations)}条')
    
    # 写入数据库
    now = datetime.now().isoformat()
    inserted = 0
    for r in unique_relations:
        rel_id = f'REL-{uuid.uuid4().hex[:12]}'
        c.execute('''
            INSERT INTO relations (rel_id, rel_type, from_obj, to_obj, attributes_json, source_article_id, confidence, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (rel_id, r['rel_type'], r['from_obj'], r['to_obj'], r['attributes_json'], r['source_article_id'], r['confidence'], now, now))
        inserted += 1
    
    conn.commit()
    conn.close()
    
    print(f'已写入数据库: {inserted}条新关系')

if __name__ == '__main__':
    main()
