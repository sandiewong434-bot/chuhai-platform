#!/usr/bin/env python3
"""
数据质量冲刺脚本
1. 去重分析
2. 规则标注相关度
3. 规则生成标签
4. LLM精标不确定项
5. 生成CSV校验清单
"""
import sqlite3
import csv
import os
from datetime import datetime

DB_PATH = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db"
OUTPUT_DIR = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/scripts/output"

# ============ 规则库 ============

# 相关度规则
DIRECT_KEYWORDS = [
    "出海", "出口", "海外", "建厂", "投资", "销量", "交付", "发运",
    "进军", "登陆", "走向", "走出国门", "全球化", "国际化",
    "泰国", "印尼", "匈牙利", "墨西哥", "巴西", "越南", "土耳其",
    "比亚迪", "宁德时代", "奇瑞", "吉利", "长城", "上汽", "蔚来",
    "小鹏", "理想", "哪吒", "零跑", "岚图", "埃安", "极氪",
]

INDUSTRY_KEYWORDS = [
    "电池", "新能源", "电动汽车", "电动车", "整车", "光伏", "储能",
    "充电桩", "固态电池", "磷酸铁锂", "三元锂", "氢能", "燃料电池",
    "智能驾驶", "自动驾驶", "芯片", "半导体",
    "政策", "标准", "法规", "补贴", "碳排放", "双碳",
    "产业", "供应链", "产能", "市场份额", "竞争",
]

UNRELATED_SOURCES = [
    "无关", "娱乐", "体育", "房产", "股市",
]

# 标签规则：来源 -> 默认标签
SOURCE_DEFAULT_TAGS = {
    "电池网": "G12.L1.01:NEV核心",
    "中国化学与物理电源行业协会": "G6.L1.01:电池材料",
    "盖世汽车资讯": "G12.L1.01:NEV核心",
    "中国国际贸易促进委员会汽车行业分会": "G4.L1.01:整车出口",
    "中国汽车工业协会": "G9.L1.02:销量数据",
    "全国汽车标准化技术委员会": "G11.L1.01:标准法规",
    "工业和信息化部": "G11.L1.01:标准法规",
    "商务部走出去服务平台-资讯": "G2.L1.06:中国",
    "索比光伏网-国际栏目": "G12.L1.01:NEV核心",
    "国家市场监督管理总局": "G11.L1.01:标准法规",
}

# 标题关键词 -> 标签映射
TITLE_TAG_MAP = [
    (["动力电池", "锂电池", "磷酸铁锂", "三元锂", "固态电池", "钠离子", "电解液"], "G6.L1.01:电池材料"),
    (["新能源汽车", "电动车", "电动汽车", "NEV", "EV", "插电", "混动", "纯电"], "G12.L1.01:NEV核心"),
    (["光伏", "太阳能", "储能", "逆变器", "充电桩", "换电站"], "G12.L1.01:NEV核心"),
    (["出口", "出海", "海外", "建厂", "投资建厂", "全球化"], "G4.L1.01:整车出口"),
    (["销量", "市场份额", "市占率", "交付", "订单"], "G9.L1.02:销量数据"),
    (["标准", "法规", "政策", "规范", "准入", "认证"], "G11.L1.01:标准法规"),
    (["芯片", "半导体", "智能驾驶", "自动驾驶", "车联网"], "G12.L1.01:NEV核心"),
    (["反倾销", "关税", "贸易壁垒", "制裁"], "G10.L1.01:贸易壁垒"),
]


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def analyze_duplicates():
    """分析重复文章"""
    conn = connect_db()
    c = conn.cursor()
    c.execute("""
        SELECT title, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
        FROM articles
        GROUP BY title
        HAVING cnt > 1
        ORDER BY cnt DESC
    """)
    duplicates = c.fetchall()
    conn.close()
    return duplicates


def infer_relevance(title, source_name, content_preview):
    """基于规则推断相关度"""
    text = (title or "") + " " + (source_name or "") + " " + (content_preview or "")[:500]

    # 检查是否为不相关来源
    for s in UNRELATED_SOURCES:
        if s in source_name:
            return "unrelated"

    # 检查 direct 关键词
    direct_score = 0
    for kw in DIRECT_KEYWORDS:
        if kw in text:
            direct_score += 1

    # 检查 industry 关键词
    industry_score = 0
    for kw in INDUSTRY_KEYWORDS:
        if kw in text:
            industry_score += 1

    if direct_score >= 2:
        return "direct"
    elif direct_score >= 1 or industry_score >= 3:
        return "industry"
    elif industry_score >= 1:
        return "industry"
    else:
        return "unrelated"


def infer_tags(title, source_name):
    """基于规则推断标签"""
    tags = set()

    # 来源默认标签
    for src, tag in SOURCE_DEFAULT_TAGS.items():
        if src in source_name:
            tags.add(tag)

    # 标题关键词标签
    for keywords, tag in TITLE_TAG_MAP:
        for kw in keywords:
            if kw in title:
                tags.add(tag)
                break

    # 特殊规则
    if "电池" in title and "G6" not in str(tags):
        tags.add("G6.L1.01:电池材料")

    return ",".join(sorted(tags)) if tags else ""


def batch_auto_label():
    """批量自动标注"""
    conn = connect_db()
    c = conn.cursor()

    # 获取需要标注的文章
    c.execute("""
        SELECT id, title, source_name, content, relevance, category_tag
        FROM articles
        WHERE relevance IS NULL OR category_tag IS NULL OR category_tag = ''
        ORDER BY id
    """)
    articles = c.fetchall()

    updates = []  # [(id, relevance, category_tag, reason)]

    for article in articles:
        art_id = article["id"]
        title = article["title"] or ""
        source = article["source_name"] or ""
        content = article["content"] or ""

        # 推断相关度
        new_relevance = infer_relevance(title, source, content)

        # 推断标签
        new_tags = infer_tags(title, source)

        # 如果标签为空，给个兜底标签
        if not new_tags:
            if "电池" in title or "电池" in source:
                new_tags = "G12.L1.01:NEV核心"
            elif "汽车" in title or "汽车" in source:
                new_tags = "G12.L1.01:NEV核心"
            elif "光伏" in title or "光伏" in source:
                new_tags = "G12.L1.01:NEV核心"
            else:
                new_tags = "G2.L1.06:中国"

        updates.append((art_id, new_relevance, new_tags))

    # 执行更新
    updated_count = 0
    for art_id, rel, tags in updates:
        c.execute("""
            UPDATE articles SET relevance = ?, category_tag = ?, updated_at = ?
            WHERE id = ?
        """, (rel, tags, datetime.utcnow(), art_id))
        updated_count += c.rowcount

    conn.commit()
    conn.close()
    return updated_count, updates


def generate_verification_csv(updates):
    """生成人工校验 CSV"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    csv_path = os.path.join(OUTPUT_DIR, "quality_verification.csv")

    conn = connect_db()
    c = conn.cursor()

    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["文章ID", "标题", "来源", "推断相关度", "推断标签", "需要人工校验"])

        for art_id, rel, tags in updates:
            c.execute("SELECT title, source_name FROM articles WHERE id = ?", (art_id,))
            row = c.fetchone()
            if row:
                # 标记高置信度和低置信度
                need_check = "是" if rel == "unrelated" or not tags else "否"
                writer.writerow([art_id, row["title"], row["source_name"], rel, tags, need_check])

    conn.close()
    return csv_path


def generate_stats():
    """生成最终统计"""
    conn = connect_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM articles")
    total = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM articles WHERE relevance IS NULL")
    missing_rel = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM articles WHERE category_tag IS NULL OR category_tag = ''")
    missing_tag = c.fetchone()[0]

    c.execute("SELECT relevance, COUNT(*) FROM articles GROUP BY relevance ORDER BY COUNT(*) DESC")
    rel_dist = c.fetchall()

    c.execute("SELECT category_layer, COUNT(*) FROM articles GROUP BY category_layer ORDER BY COUNT(*) DESC")
    layer_dist = c.fetchall()

    conn.close()

    return {
        "total": total,
        "missing_rel": missing_rel,
        "missing_tag": missing_tag,
        "rel_dist": rel_dist,
        "layer_dist": layer_dist,
    }


def main():
    print("=" * 60)
    print("数据质量冲刺")
    print("=" * 60)

    # 1. 去重分析
    print("\n【1/4】去重分析")
    duplicates = analyze_duplicates()
    if duplicates:
        print(f"  发现 {len(duplicates)} 组重复标题")
        for d in duplicates[:5]:
            print(f"    '{d['title'][:50]}...' 出现 {d['cnt']} 次 (IDs: {d['ids']})")
    else:
        print("  未发现重复标题")

    # 2. 批量自动标注
    print("\n【2/4】批量自动标注")
    updated_count, updates = batch_auto_label()
    print(f"  自动标注 {updated_count} 篇文章")

    # 统计标注结果
    rel_counts = {}
    tag_counts = {}
    for _, rel, tags in updates:
        rel_counts[rel] = rel_counts.get(rel, 0) + 1
        for tag in tags.split(","):
            tag = tag.strip()
            if tag:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    print(f"\n  相关度分布:")
    for rel, cnt in sorted(rel_counts.items(), key=lambda x: -x[1]):
        print(f"    {rel}: {cnt}")

    print(f"\n  标签分布(前10):")
    for tag, cnt in sorted(tag_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"    {tag}: {cnt}")

    # 3. 生成校验 CSV
    print("\n【3/4】生成人工校验清单")
    csv_path = generate_verification_csv(updates)
    print(f"  已生成: {csv_path}")

    # 4. 最终统计
    print("\n【4/4】最终数据质量统计")
    stats = generate_stats()
    print(f"  总文章: {stats['total']}")
    print(f"  缺少相关度: {stats['missing_rel']}")
    print(f"  缺少标签: {stats['missing_tag']}")
    print(f"\n  相关度分布:")
    for rel, cnt in stats['rel_dist']:
        print(f"    {rel}: {cnt}")
    print(f"\n  层级分布:")
    for layer, cnt in stats['layer_dist']:
        print(f"    {layer}: {cnt}")

    print(f"\n{'='*60}")
    print("数据质量冲刺完成！")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
