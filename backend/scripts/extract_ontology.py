"""
本体数据抽取脚本 - 规则预抽 + LLM 精抽
从276篇文章中提取企业、目的国、产品实体及关系
"""
import sqlite3
import json
import re
import hashlib
from datetime import datetime

DB_PATH = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"

# ============ 实体关键词库 ============
ENTERPRISES = [
    # 整车企业
    "比亚迪", "奇瑞", "吉利", "长城", "上汽", "广汽", "长安", "一汽", "东风", "北汽",
    "蔚来", "小鹏", "理想", "哪吒", "零跑", "岚图", "埃安", "极氪", "问界", "智己",
    "腾势", "方程豹", "仰望", "哈弗", "欧拉", "WEY", "坦克", "传祺", "荣威", "名爵",
    "MG", "宝骏", "五菱", "江淮", "海马", "众泰", "猎豹", "华泰", "力帆", "小康",
    "赛力斯", "创维", "大运", "合创", "爱驰", "威马", "高合", "恒驰",
    # 电池企业
    "宁德时代", "比亚迪", "中创新航", "国轩高科", "亿纬锂能", "欣旺达", "蜂巢能源",
    "孚能科技", "瑞浦兰钧", "捷新动力", "力神电池", "SK On", "LG新能源", "松下",
    # 光伏企业
    "隆基绿能", "通威股份", "晶科能源", "天合光能", "晶澳科技", "阿特斯", "东方日升",
    # 其他
    "华为", "小米", "大疆", "海康威视", "大华", "TCL", "海尔", "海信", "美的", "格力",
]

COUNTRIES = [
    "泰国", "印度尼西亚", "印尼", "匈牙利", "墨西哥", "巴西", "越南", "土耳其", "埃及",
    "德国", "法国", "意大利", "西班牙", "波兰", "捷克", "罗马尼亚", "荷兰", "比利时",
    "瑞典", "挪威", "芬兰", "丹麦", "奥地利", "瑞士", "葡萄牙", "希腊",
    "阿联酋", "沙特", "沙特阿拉伯", "南非", "澳大利亚", "新西兰",
    "马来西亚", "菲律宾", "新加坡", "印度", "巴基斯坦", "孟加拉国",
    "俄罗斯", "日本", "韩国", "美国", "加拿大", "英国", "阿根廷", "智利", "秘鲁",
    "哥伦比亚", "乌拉圭", "摩洛哥", "肯尼亚", "尼日利亚", "埃塞俄比亚",
]

PRODUCTS = [
    "新能源汽车", "电动汽车", "电动车", "纯电", "混动", "插混", "增程",
    "动力电池", "锂电池", "磷酸铁锂", "三元锂", "固态电池", "钠离子电池",
    "光伏组件", "太阳能电池", "逆变器", "储能", "充电桩", "换电站",
    "芯片", "半导体", "智能驾驶", "自动驾驶", "车联网",
]

RELATION_KEYWORDS = {
    "投资建厂": ["建厂", "投资", "工厂", "生产基地", "产能", "本地化生产", "本土化生产", "当地建厂"],
    "出口到": ["出口", "销往", "交付", "发运", "出海", "进军", "进入", "登陆"],
    "销量数据": ["销量", "销售", "交付量", "市场份额", "市占率", "增长", "同比", "环比"],
    "合作签约": ["合作", "签约", "协议", "战略合作", "备忘录", "合资", "联手", "联手"],
    "面临壁垒": ["反倾销", "反补贴", "关税", "贸易壁垒", "调查", "制裁", "限制", "禁令"],
}


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def extract_from_title(title):
    """从标题中提取实体"""
    found_enterprises = []
    found_countries = []
    found_products = []
    found_relations = []

    for e in ENTERPRISES:
        if e in title:
            found_enterprises.append(e)

    for c in COUNTRIES:
        if c in title:
            # 统一印尼/印度尼西亚
            name = "印度尼西亚" if c == "印尼" else c
            if name not in found_countries:
                found_countries.append(name)

    for p in PRODUCTS:
        if p in title:
            if p not in found_products:
                found_products.append(p)

    for rel_type, keywords in RELATION_KEYWORDS.items():
        for kw in keywords:
            if kw in title:
                found_relations.append(rel_type)
                break

    return found_enterprises, found_countries, found_products, found_relations


def generate_obj_id(name, obj_type):
    h = hashlib.md5(f"{obj_type}:{name}".encode()).hexdigest()[:12]
    return f"OBJ-{obj_type[:2].upper()}-{h}"


def generate_rel_id(from_obj, to_obj, rel_type):
    h = hashlib.md5(f"{from_obj}:{rel_type}:{to_obj}".encode()).hexdigest()[:12]
    return f"REL-{h}"


def rule_based_extract():
    """基于规则的实体关系抽取"""
    conn = connect_db()
    c = conn.cursor()

    # 获取所有文章
    c.execute("SELECT id, title, content, category_tag, category_layer, relevance FROM articles")
    articles = c.fetchall()

    # 收集实体和关系
    objects_map = {}  # name -> {obj_id, obj_type, ...}
    relations_list = []  # [{rel_id, rel_type, from_obj, to_obj, source_article_id, confidence}]

    for article in articles:
        art_id = article["id"]
        title = article["title"] or ""
        content = (article["content"] or "")[:500]  # 取前500字辅助判断
        text = title + content

        ents, cnts, prods, rels = extract_from_title(text)

        # 注册实体
        for e in ents:
            if e not in objects_map:
                objects_map[e] = {
                    "obj_id": generate_obj_id(e, "企业"),
                    "obj_type": "企业",
                    "name": e,
                    "attributes_json": None,
                    "source_libraries": None,
                }

        for c_name in cnts:
            if c_name not in objects_map:
                objects_map[c_name] = {
                    "obj_id": generate_obj_id(c_name, "目的国"),
                    "obj_type": "目的国",
                    "name": c_name,
                    "attributes_json": None,
                    "source_libraries": None,
                }

        for p in prods:
            if p not in objects_map:
                objects_map[p] = {
                    "obj_id": generate_obj_id(p, "产品"),
                    "obj_type": "产品",
                    "name": p,
                    "attributes_json": None,
                    "source_libraries": None,
                }

        # 生成关系：企业 -> 目的国
        for e in ents:
            for c_name in cnts:
                for rel_type in rels:
                    rel_id = generate_rel_id(e, c_name, rel_type)
                    # 去重：同一对实体同一关系只保留一次
                    existing = [r for r in relations_list
                               if r["from_obj"] == e and r["to_obj"] == c_name and r["rel_type"] == rel_type]
                    if not existing:
                        relations_list.append({
                            "rel_id": rel_id,
                            "rel_type": rel_type,
                            "from_obj": e,
                            "to_obj": c_name,
                            "attributes_json": json.dumps({"依据": "标题关键词匹配"}),
                            "source_article_id": art_id,
                            "confidence": "低",
                            "category": article["category_tag"],
                        })

    conn.close()
    return objects_map, relations_list


def save_to_db(objects_map, relations_list):
    """保存到数据库"""
    conn = connect_db()
    c = conn.cursor()

    now = datetime.utcnow().isoformat()

    # 清空现有数据（保留 relations 中已有数据的去重判断）
    # 先插入 objects
    obj_count = 0
    for name, obj in objects_map.items():
        try:
            c.execute("""
                INSERT OR IGNORE INTO objects (obj_id, obj_type, name, attributes_json, source_libraries, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (obj["obj_id"], obj["obj_type"], obj["name"],
                  obj["attributes_json"], obj["source_libraries"], now, now))
            obj_count += c.rowcount
        except Exception as e:
            print(f"  插入对象失败 {name}: {e}")

    # 插入 relations
    rel_count = 0
    for rel in relations_list:
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


if __name__ == "__main__":
    print("=" * 50)
    print("本体数据抽取 - 规则预抽阶段")
    print("=" * 50)

    objects_map, relations_list = rule_based_extract()
    print(f"\n提取到实体: {len(objects_map)} 个")
    print(f"提取到关系: {len(relations_list)} 条")

    # 按类型统计
    type_counts = {}
    for obj in objects_map.values():
        type_counts[obj["obj_type"]] = type_counts.get(obj["obj_type"], 0) + 1
    print(f"\n实体类型分布:")
    for t, cnt in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {cnt}")

    # 关系类型分布
    rel_type_counts = {}
    for rel in relations_list:
        rel_type_counts[rel["rel_type"]] = rel_type_counts.get(rel["rel_type"], 0) + 1
    print(f"\n关系类型分布:")
    for t, cnt in sorted(rel_type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {cnt}")

    # 保存
    obj_inserted, rel_inserted = save_to_db(objects_map, relations_list)
    print(f"\n写入数据库:")
    print(f"  新增对象: {obj_inserted}")
    print(f"  新增关系: {rel_inserted}")

    # 展示样本
    print(f"\n样本实体:")
    for obj in list(objects_map.values())[:10]:
        print(f"  [{obj['obj_type']}] {obj['name']}")
    print(f"\n样本关系:")
    for rel in relations_list[:5]:
        print(f"  {rel['from_obj']} --[{rel['rel_type']}]--> {rel['to_obj']}")
