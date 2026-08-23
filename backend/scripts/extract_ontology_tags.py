#!/usr/bin/env python3
"""
本体数据扩充 - 基于标签和精细规则的二次抽取
利用已标注的G1-G12标签直接生成关系，补充规则预抽的不足
"""
import sqlite3
import json
import hashlib
from datetime import datetime

DB_PATH = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"

# 扩展国家映射（标签中的地区 -> 具体国家）
REGION_TO_COUNTRIES = {
    "东南亚": ["泰国", "印度尼西亚", "越南", "马来西亚", "菲律宾", "新加坡"],
    "欧洲": ["德国", "法国", "意大利", "西班牙", "匈牙利", "波兰", "捷克", "罗马尼亚", "荷兰", "比利时", "瑞典", "挪威", "英国"],
    "北美": ["美国", "加拿大", "墨西哥"],
    "南美": ["巴西", "阿根廷", "智利", "秘鲁", "哥伦比亚"],
    "中东": ["阿联酋", "沙特", "土耳其", "埃及"],
    "非洲": ["南非", "尼日利亚", "肯尼亚", "埃塞俄比亚", "埃及"],
    "东亚": ["日本", "韩国"],
    "南亚": ["印度", "巴基斯坦", "孟加拉国"],
    "大洋洲": ["澳大利亚", "新西兰"],
    "中亚": ["哈萨克斯坦", "乌兹别克斯坦"],
    "俄罗斯": ["俄罗斯"],
}

# 标签到关系类型的映射
TAG_TO_RELATION = {
    "投资建厂": "投资建厂",
    "整车出口": "出口到",
    "销量数据": "销量数据",
    "合作": "合作签约",
    "贸易壁垒": "面临壁垒",
    "反倾销": "面临壁垒",
    "关税": "面临壁垒",
}

# 扩展企业关键词（从文章标题高频词中提取）
EXTRA_ENTERPRISES = [
    "五十铃", "大众", "丰田", "本田", "日产", "现代", "起亚", "福特", "通用",
    "Stellantis", "特斯拉", "沃尔沃", "奔驰", "宝马", "奥迪", "标致", "雪铁龙",
    "三菱", "斯巴鲁", "铃木", "马自达", "雷克萨斯", "英菲尼迪", "讴歌",
    "斯柯达", "西雅特", "Cupra", "达契亚", "欧宝",
    "国轩高科", "亿纬锂能", "欣旺达", "蜂巢能源", "孚能科技",
    "隆基绿能", "晶科能源", "天合光能", "晶澳科技",
    "正泰", "特变电工", "阳光电源", "锦浪科技", "固德威",
    "蔚来", "小鹏", "理想", "哪吒", "零跑", "岚图", "埃安", "极氪",
    "小米汽车", "华为智选", "鸿蒙智行",
    "中创新航", "瑞浦兰钧", "捷新动力", "力神电池",
    "东方日升", "阿特斯", "正泰新能", "一道新能", "协鑫集成",
    "晶科", "天合", "晶澳", "隆基",
]

# 扩展国家关键词
EXTRA_COUNTRIES = [
    "泰国", "印尼", "印度尼西亚", "匈牙利", "墨西哥", "巴西", "越南",
    "土耳其", "埃及", "德国", "法国", "意大利", "西班牙", "波兰",
    "美国", "加拿大", "日本", "韩国", "印度", "澳大利亚", "英国",
    "俄罗斯", "马来西亚", "菲律宾", "新加坡", "阿联酋", "沙特",
    "南非", "阿根廷", "智利", "瑞典", "挪威", "荷兰", "比利时",
    "捷克", "罗马尼亚", "奥地利", "瑞士", "葡萄牙", "希腊",
    "芬兰", "丹麦", "新西兰", "巴基斯坦", "孟加拉国",
    "哈萨克斯坦", "乌兹别克斯坦", "肯尼亚", "尼日利亚", "埃塞俄比亚",
    "摩洛哥",
]


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def generate_obj_id(name, obj_type):
    h = hashlib.md5(f"{obj_type}:{name}".encode()).hexdigest()[:12]
    return f"OBJ-{obj_type[:2].upper()}-{h}"


def generate_rel_id(from_obj, to_obj, rel_type):
    h = hashlib.md5(f"{from_obj}:{rel_type}:{to_obj}".encode()).hexdigest()[:12]
    return f"REL-{h}"


def extract_from_tags_and_title(article):
    """基于标签和标题的精细抽取"""
    title = article["title"] or ""
    tags = article["category_tag"] or ""
    layer = article["category_layer"] or ""

    found_enterprises = []
    found_countries = []
    found_relations = []

    # 1. 从标题匹配企业
    for e in EXTRA_ENTERPRISES:
        if e in title:
            found_enterprises.append(e)

    # 2. 从标题匹配国家
    for c in EXTRA_COUNTRIES:
        if c in title:
            name = "印度尼西亚" if c == "印尼" else c
            if name not in found_countries:
                found_countries.append(name)

    # 3. 从标签解析地区 -> 国家
    for region, countries in REGION_TO_COUNTRIES.items():
        if region in tags:
            for c in countries:
                if c not in found_countries:
                    found_countries.append(c)

    # 4. 从标签解析关系类型
    for tag_keyword, rel_type in TAG_TO_RELATION.items():
        if tag_keyword in tags or tag_keyword in title:
            found_relations.append(rel_type)

    # 5. 从标题关键词推断关系
    title_lower = title.lower()
    if any(kw in title for kw in ["建厂", "工厂", "产能", "生产基地", "本地化生产", "本土化"]):
        if "投资建厂" not in found_relations:
            found_relations.append("投资建厂")
    if any(kw in title for kw in ["出口", "销往", "交付", "发运", "进军", "登陆", "进入"]):
        if "出口到" not in found_relations:
            found_relations.append("出口到")
    if any(kw in title for kw in ["销量", "销售", "市场份额", "市占率", "增长"]):
        if "销量数据" not in found_relations:
            found_relations.append("销量数据")
    if any(kw in title for kw in ["合作", "签约", "协议", "战略合作", "备忘录", "合资"]):
        if "合作签约" not in found_relations:
            found_relations.append("合作签约")
    if any(kw in title for kw in ["反倾销", "反补贴", "关税", "贸易壁垒", "制裁", "限制"]):
        if "面临壁垒" not in found_relations:
            found_relations.append("面临壁垒")

    return found_enterprises, found_countries, found_relations


def expand_relations():
    """基于标签和标题扩充关系"""
    conn = connect_db()
    c = conn.cursor()

    # 获取所有带标签的文章
    c.execute("""
        SELECT id, title, category_tag, category_layer, relevance
        FROM articles
        WHERE (category_tag IS NOT NULL AND category_tag != '') 
           OR category_layer = 'enterprise'
           OR relevance = 'direct'
        ORDER BY id
    """)
    articles = c.fetchall()

    # 获取现有对象（避免重复）
    c.execute("SELECT name, obj_type FROM objects")
    existing_objects = {row["name"]: row["obj_type"] for row in c.fetchall()}

    # 获取现有关系（避免重复）
    c.execute("SELECT from_obj, to_obj, rel_type FROM relations")
    existing_relations = set()
    for row in c.fetchall():
        existing_relations.add((row["from_obj"], row["to_obj"], row["rel_type"]))

    conn.close()

    new_objects = []
    new_relations = []

    for article in articles:
        ents, cnts, rels = extract_from_tags_and_title(article)

        # 注册新实体
        for e in ents:
            if e not in existing_objects:
                existing_objects[e] = "企业"
                new_objects.append({
                    "obj_id": generate_obj_id(e, "企业"),
                    "obj_type": "企业",
                    "name": e,
                    "attributes_json": None,
                    "source_libraries": None,
                })

        for c in cnts:
            if c not in existing_objects:
                existing_objects[c] = "目的国"
                new_objects.append({
                    "obj_id": generate_obj_id(c, "目的国"),
                    "obj_type": "目的国",
                    "name": c,
                    "attributes_json": None,
                    "source_libraries": None,
                })

        # 生成关系：企业 -> 目的国
        for e in ents:
            for c in cnts:
                for rel_type in rels:
                    key = (e, c, rel_type)
                    if key not in existing_relations:
                        existing_relations.add(key)
                        rel_id = generate_rel_id(e, c, rel_type)
                        new_relations.append({
                            "rel_id": rel_id,
                            "rel_type": rel_type,
                            "from_obj": e,
                            "to_obj": c,
                            "attributes_json": json.dumps({"抽取方式": "标签规则抽取"}),
                            "source_article_id": article["id"],
                            "confidence": "中",
                            "category": article["category_tag"],
                        })

    return new_objects, new_relations


def save_results(new_objects, new_relations):
    conn = connect_db()
    c = conn.cursor()
    now = datetime.utcnow().isoformat()

    obj_count = 0
    for obj in new_objects:
        try:
            c.execute("""
                INSERT OR IGNORE INTO objects (obj_id, obj_type, name, attributes_json, source_libraries, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (obj["obj_id"], obj["obj_type"], obj["name"],
                  obj["attributes_json"], obj["source_libraries"], now, now))
            obj_count += c.rowcount
        except Exception as e:
            print(f"  插入对象失败 {obj['name']}: {e}")

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
    return obj_count, rel_count


def main():
    print("=" * 60)
    print("本体数据扩充 - 标签规则二次抽取")
    print("=" * 60)

    new_objects, new_relations = expand_relations()

    print(f"\n提取到新实体: {len(new_objects)} 个")
    print(f"提取到新关系: {len(new_relations)} 条")

    # 按类型统计
    type_counts = {}
    for obj in new_objects:
        type_counts[obj["obj_type"]] = type_counts.get(obj["obj_type"], 0) + 1
    print(f"\n新实体类型分布:")
    for t, cnt in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {cnt}")

    # 关系类型分布
    rel_type_counts = {}
    for rel in new_relations:
        rel_type_counts[rel["rel_type"]] = rel_type_counts.get(rel["rel_type"], 0) + 1
    print(f"\n新关系类型分布:")
    for t, cnt in sorted(rel_type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {cnt}")

    # 保存
    obj_count, rel_count = save_results(new_objects, new_relations)
    print(f"\n写入数据库:")
    print(f"  新增对象: {obj_count}")
    print(f"  新增关系: {rel_count}")

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

    # 样本关系
    print(f"\n样本关系:")
    for rel in new_relations[:10]:
        print(f"  {rel['from_obj']} --[{rel['rel_type']}]--> {rel['to_obj']} (置信度:{rel['confidence']})")


if __name__ == "__main__":
    main()
