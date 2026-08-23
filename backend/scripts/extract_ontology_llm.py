#!/usr/bin/env python3
"""
本体数据抽取 - LLM 精抽阶段
对高价值文章进行深度实体关系抽取
"""
import os
import sys
import sqlite3
import json
import hashlib
from datetime import datetime

# 添加 backend 到路径
sys.path.insert(0, "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend")

from app.services.llm_client import get_llm_client

DB_PATH = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"


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


def get_priority_articles(limit=30):
    """获取高价值文章：企业级、direct相关、投资建厂标签、较长正文"""
    conn = connect_db()
    c = conn.cursor()

    # 优先选取企业级 + direct相关 + 投资建厂标签的文章
    c.execute("""
        SELECT id, title, content, source_name, category_tag, category_layer, relevance
        FROM articles
        WHERE (category_layer = 'enterprise' OR relevance = 'direct'
               OR category_tag LIKE '%投资建厂%'
               OR category_tag LIKE '%G4%')
          AND content IS NOT NULL
          AND LENGTH(content) > 200
        ORDER BY 
            CASE category_layer WHEN 'enterprise' THEN 0 ELSE 1 END,
            CASE relevance WHEN 'direct' THEN 0 ELSE 1 END,
            LENGTH(content) DESC
        LIMIT ?
    """, (limit,))

    articles = c.fetchall()
    conn.close()
    return articles


def build_prompt(articles_batch):
    """构建LLM抽取Prompt"""
    lines = []
    for i, art in enumerate(articles_batch, 1):
        content_preview = (art["content"] or "")[:800]
        lines.append(f"""
【文章{i}】
标题：{art['title']}
来源：{art['source_name']}
标签：{art['category_tag'] or '无'}
正文片段：{content_preview}
""")

    articles_text = "\n".join(lines)

    prompt = f"""你是出海领域的本体知识抽取专家。请从以下文章中提取实体和关系。

【实体类型】
- 企业：中国出海企业名称（如比亚迪、宁德时代、奇瑞、吉利、长城、上汽等）
- 目的国：海外国家/地区名称（如泰国、匈牙利、墨西哥、印尼、巴西等）
- 产品：具体产品类型（如新能源汽车、动力电池、光伏组件等）

【关系类型】
- 投资建厂：企业在目的国投资建设工厂
- 出口到：产品出口销售到目的国
- 销量数据：企业在目的国的销售数据/市场份额
- 合作签约：企业与当地企业/政府签署合作协议
- 面临壁垒：企业在目的国遭遇关税/反倾销/贸易限制

【文章列表】{articles_text}

请对每篇文章抽取实体关系三元组，输出严格的JSON格式：
{{
  "results": [
    {{
      "article_index": 1,
      "entities": [
        {{"name": "比亚迪", "type": "企业"}},
        {{"name": "泰国", "type": "目的国"}}
      ],
      "relations": [
        {{"from": "比亚迪", "to": "泰国", "type": "投资建厂", "confidence": "高"}}
      ]
    }}
  ]
}}

要求：
1. 只抽取文章中明确提到的实体和关系，不要猜测
2. 如果文章中没有明确的企业-国家关系，relations可以为空数组
3. confidence 只能是 "高"、"中"、"低" 之一
4. 必须返回合法JSON，不要添加任何解释文字
"""
    return prompt


def parse_llm_response(text):
    """解析LLM返回的JSON"""
    # 尝试从文本中提取JSON
    text = text.strip()

    # 如果包裹在代码块中
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        data = json.loads(text)
        return data.get("results", [])
    except json.JSONDecodeError as e:
        print(f"  JSON解析失败: {e}")
        print(f"  原始文本前200字: {text[:200]}")
        return []


def llm_extract_batch(articles_batch):
    """用LLM抽取一批文章"""
    client = get_llm_client()
    if not client:
        print("  LLM客户端不可用，跳过")
        return []

    prompt = build_prompt(articles_batch)
    print(f"  调用LLM处理 {len(articles_batch)} 篇文章...")

    try:
        response = client.complete(prompt, max_tokens=4000)
        results = parse_llm_response(response)
        print(f"  LLM返回 {len(results)} 篇文章的抽取结果")
        return results
    except Exception as e:
        print(f"  LLM调用失败: {e}")
        return []


def merge_results(all_results, existing_objects, existing_relations):
    """合并LLM抽取结果到数据库"""
    objects_map = {obj["name"]: obj for obj in existing_objects}
    relations_set = set()
    for rel in existing_relations:
        relations_set.add((rel["from_obj"], rel["to_obj"], rel["rel_type"]))

    new_objects = []
    new_relations = []

    for result in all_results:
        article_id = None  # 稍后从 articles_batch 映射
        for ent in result.get("entities", []):
            name = ent["name"]
            obj_type = ent["type"]
            if name not in objects_map:
                obj_id = generate_obj_id(name, obj_type)
                objects_map[name] = {
                    "obj_id": obj_id,
                    "obj_type": obj_type,
                    "name": name,
                    "attributes_json": None,
                    "source_libraries": None,
                }
                new_objects.append(objects_map[name])

        for rel in result.get("relations", []):
            from_obj = rel["from"]
            to_obj = rel["to"]
            rel_type = rel["type"]
            confidence = rel.get("confidence", "中")

            key = (from_obj, to_obj, rel_type)
            if key not in relations_set:
                relations_set.add(key)
                rel_id = generate_rel_id(from_obj, to_obj, rel_type)
                new_relations.append({
                    "rel_id": rel_id,
                    "rel_type": rel_type,
                    "from_obj": from_obj,
                    "to_obj": to_obj,
                    "attributes_json": json.dumps({"抽取方式": "LLM精抽"}),
                    "source_article_id": None,  # 稍后填充
                    "confidence": confidence,
                    "category": None,
                })

    return new_objects, new_relations


def save_results(new_objects, new_relations):
    """保存到数据库"""
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
    print("本体数据抽取 - LLM 精抽阶段")
    print("=" * 60)

    # 获取现有数据
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT * FROM objects")
    existing_objects = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM relations")
    existing_relations = [dict(row) for row in c.fetchall()]
    conn.close()

    print(f"\n现有数据: {len(existing_objects)} 个对象, {len(existing_relations)} 条关系")

    # 获取高价值文章
    articles = get_priority_articles(limit=25)
    print(f"选取 {len(articles)} 篇高价值文章进行LLM精抽")

    # 分批处理（每批5篇）
    batch_size = 5
    all_results = []

    for i in range(0, len(articles), batch_size):
        batch = articles[i:i + batch_size]
        print(f"\n处理批次 {i//batch_size + 1}/{(len(articles)-1)//batch_size + 1} (文章 {i+1}-{min(i+batch_size, len(articles))})")

        results = llm_extract_batch(batch)

        # 映射 article_index 到真实 article_id
        for j, result in enumerate(results):
            idx = result.get("article_index", j + 1) - 1
            if 0 <= idx < len(batch):
                article_id = batch[idx]["id"]
                # 将 article_id 注入到关系的 source_article_id 中
                for rel in result.get("relations", []):
                    rel["_article_id"] = article_id
            all_results.append(result)

    print(f"\nLLM共抽取 {len(all_results)} 篇文章的结果")

    # 合并结果
    new_objects, new_relations = merge_results(all_results, existing_objects, existing_relations)
    print(f"合并后: {len(new_objects)} 个新对象, {len(new_relations)} 条新关系")

    # 修复 article_id 映射
    for result in all_results:
        for rel in result.get("relations", []):
            if "_article_id" in rel:
                for nr in new_relations:
                    if (nr["from_obj"] == rel.get("from") and
                        nr["to_obj"] == rel.get("to") and
                        nr["rel_type"] == rel.get("type") and
                        nr["source_article_id"] is None):
                        nr["source_article_id"] = rel["_article_id"]
                        break

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


if __name__ == "__main__":
    main()
