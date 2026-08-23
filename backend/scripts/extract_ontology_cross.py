#!/usr/bin/env python3
"""
本体数据扩充 - 全文交叉匹配
用已知的实体名去匹配所有文章标题，生成更多关系
"""
import sqlite3
import json
import hashlib
from datetime import datetime

DB_PATH = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"

# 标题关键词 -> 关系类型
TITLE_RELATION_MAP = [
    (["建厂", "工厂", "产能", "生产基地", "本地化生产", "本土化", "投资"], "投资建厂"),
    (["出口", "销往", "交付", "发运", "进军", "登陆", "进入", "驶向", "驶向", "走出国门"], "出口到"),
    (["销量", "销售", "市场份额", "市占率", "同比增长", "环比增长", "售出", "订单"], "销量数据"),
    (["合作", "签约", "协议", "战略合作", "备忘录", "合资", "联手", "联手", "联手", "伙伴关系"], "合作签约"),
    (["反倾销", "反补贴", "关税", "贸易壁垒", "制裁", "限制", "禁令", "加征", "壁垒"], "面临壁垒"),
]


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def generate_rel_id(from_obj, to_obj, rel_type):
    h = hashlib.md5(f"{from_obj}:{rel_type}:{to_obj}".encode()).hexdigest()[:12]
    return f"REL-{h}"


def infer_relation_type(title):
    """根据标题关键词推断关系类型"""
    for keywords, rel_type in TITLE_RELATION_MAP:
        for kw in keywords:
            if kw in title:
                return rel_type
    return None


def cross_match_all_articles():
    """用已有实体名交叉匹配所有文章标题"""
    conn = connect_db()
    c = conn.cursor()

    # 获取所有实体名
    c.execute("SELECT name, obj_type FROM objects")
    enterprises = []
    countries = []
    products = []
    for row in c.fetchall():
        if row["obj_type"] == "企业":
            enterprises.append(row["name"])
        elif row["obj_type"] == "目的国":
            countries.append(row["name"])
        elif row["obj_type"] == "产品":
            products.append(row["name"])

    print(f"已知实体: {len(enterprises)} 企业, {len(countries)} 国家, {len(products)} 产品")

    # 获取所有文章
    c.execute("SELECT id, title, category_tag, category_layer, relevance FROM articles WHERE title IS NOT NULL")
    articles = c.fetchall()

    # 获取现有关系
    c.execute("SELECT from_obj, to_obj, rel_type FROM relations")
    existing_relations = set()
    for row in c.fetchall():
        existing_relations.add((row["from_obj"], row["to_obj"], row["rel_type"]))

    conn.close()

    new_relations = []

    for article in articles:
        title = article["title"]

        # 匹配标题中的企业
        matched_ents = [e for e in enterprises if e in title]
        # 匹配标题中的国家
        matched_cnts = [c for c in countries if c in title]
        # 匹配标题中的产品
        matched_prods = [p for p in products if p in title]

        # 推断关系类型
        rel_type = infer_relation_type(title)

        # 如果没有从标题推断出关系，尝试从标签推断
        if not rel_type and article["category_tag"]:
            tags = article["category_tag"]
            if "投资建厂" in tags or "G4.L1.02" in tags:
                rel_type = "投资建厂"
            elif "整车出口" in tags or "G4.L1.01" in tags:
                rel_type = "出口到"
            elif "销量数据" in tags or "G9.L1.02" in tags:
                rel_type = "销量数据"
            elif "贸易壁垒" in tags or "G10" in tags:
                rel_type = "面临壁垒"

        if not rel_type:
            continue

        # 生成企业 -> 国家关系
        for e in matched_ents:
            for c in matched_cnts:
                key = (e, c, rel_type)
                if key not in existing_relations:
                    existing_relations.add(key)
                    rel_id = generate_rel_id(e, c, rel_type)
                    new_relations.append({
                        "rel_id": rel_id,
                        "rel_type": rel_type,
                        "from_obj": e,
                        "to_obj": c,
                        "attributes_json": json.dumps({"抽取方式": "标题交叉匹配", "依据": title[:50]}),
                        "source_article_id": article["id"],
                        "confidence": "中",
                        "category": article["category_tag"],
                    })

        # 生成企业 -> 产品关系（产品关联）
        for e in matched_ents:
            for p in matched_prods:
                key = (e, p, "生产/研发")
                if key not in existing_relations:
                    existing_relations.add(key)
                    rel_id = generate_rel_id(e, p, "生产/研发")
                    new_relations.append({
                        "rel_id": rel_id,
                        "rel_type": "生产/研发",
                        "from_obj": e,
                        "to_obj": p,
                        "attributes_json": json.dumps({"抽取方式": "标题交叉匹配", "依据": title[:50]}),
                        "source_article_id": article["id"],
                        "confidence": "低",
                        "category": article["category_tag"],
                    })

    return new_relations


def save_relations(new_relations):
    conn = connect_db()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()

    rel_count = 0
    for rel in new_relations:
        try:
            c.execute("""
                INSERT OR IGNORE INTO relations (rel_id, rel_type, from_obj, to_obj, attributes_json, source_article_id, confidence, category, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (rel["rel_id"], rel["rel_type"], rel["from_obj"], rel["to_obj"],
                  rel["attributes_json"], rel["source_article_id"], rel["confidence"],
                  rel["category"], now, now))
            rel_count += c.rowcount
        except Exception as e:
            print(f"  插入关系失败 {rel['rel_id']}: {e}")

    conn.commit()
    conn.close()
    return rel_count


def main():
    print("=" * 60)
    print("本体数据扩充 - 全文交叉匹配")
    print("=" * 60)

    new_relations = cross_match_all_articles()

    print(f"\n提取到新关系: {len(new_relations)} 条")

    # 关系类型分布
    rel_type_counts = {}
    for rel in new_relations:
        rel_type_counts[rel["rel_type"]] = rel_type_counts.get(rel["rel_type"], 0) + 1
    print(f"\n新关系类型分布:")
    for t, cnt in sorted(rel_type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {cnt}")

    # 保存
    rel_count = save_relations(new_relations)
    print(f"\n写入数据库: 新增 {rel_count} 条关系")

    # 最终统计
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM objects")
    total_objects = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM relations")
    total_relations = c.fetchone()[0]
    c.execute("SELECT obj_type, COUNT(*) FROM objects GROUP BY obj_type")
    type_dist = c.fetchall()
    c.execute("SELECT rel_type, COUNT(*) FROM relations GROUP BY rel_type")
    rel_dist = c.fetchall()
    conn.close()

    print(f"\n最终统计:")
    print(f"  总对象: {total_objects}")
    print(f"  总关系: {total_relations}")
    print(f"\n  实体分布:")
    for t, cnt in type_dist:
        print(f"    {t}: {cnt}")
    print(f"\n  关系分布:")
    for t, cnt in rel_dist:
        print(f"    {t}: {cnt}")

    # 样本
    print(f"\n样本关系:")
    for rel in new_relations[:15]:
        print(f"  {rel['from_obj']} --[{rel['rel_type']}]--> {rel['to_obj']}")


if __name__ == "__main__":
    main()
