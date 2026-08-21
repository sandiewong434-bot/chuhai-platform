# -*- coding: utf-8 -*-
"""
LLM 语义标注服务
基于 G1-G12 标签体系，对文章进行自动分类与标签标注

使用方法：
    from app.services.llm_tagger import tag_article, batch_tag_articles
    tags = tag_article(title="...", content="...")
    batch_tag_articles(db_session, limit=100)
"""

import json
import re
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.models import Article, ObjectEntity, Relation

# ============================================================
# G1-G12 标签体系定义
# ============================================================

TAG_SCHEMA = {
    "G1": {
        "name": "信源属性",
        "description": "信息来源与可信度",
        "levels": [
            {"code": "G1.L1.01", "name": "政府官网/国际组织", "weight": 1.0},
            {"code": "G1.L1.02", "name": "行业协会/智库", "weight": 0.9},
            {"code": "G1.L1.03", "name": "主流媒体", "weight": 0.8},
            {"code": "G1.L1.04", "name": "企业官方", "weight": 0.85},
            {"code": "G1.L1.05", "name": "自媒体/博客", "weight": 0.5},
        ],
    },
    "G2": {
        "name": "国别与区域",
        "description": "涉及的国家或地区",
        "levels": [
            {"code": "G2.L1.01", "name": "东南亚", "countries": ["TH", "ID", "VN", "MY", "PH", "SG"]},
            {"code": "G2.L1.02", "name": "欧洲", "countries": ["HU", "DE", "ES", "FR", "IT", "PL"]},
            {"code": "G2.L1.03", "name": "中东/非洲", "countries": ["TR", "EG", "SA", "AE", "ZA"]},
            {"code": "G2.L1.04", "name": "拉美", "countries": ["MX", "BR", "AR", "CL"]},
            {"code": "G2.L1.05", "name": "北美", "countries": ["US", "CA"]},
            {"code": "G2.L1.06", "name": "中国", "countries": ["CN"]},
        ],
    },
    "G3": {
        "name": "产业链环节",
        "description": "NEV 产业链位置",
        "levels": [
            {"code": "G3.L1.01", "name": "整车制造"},
            {"code": "G3.L1.02", "name": "动力电池"},
            {"code": "G3.L1.03", "name": "电机电控"},
            {"code": "G3.L1.04", "name": "智能驾驶"},
            {"code": "G3.L1.05", "name": "充电设施"},
            {"code": "G3.L1.06", "name": "上游材料（锂/钴/镍）"},
            {"code": "G3.L1.07", "name": "零部件"},
        ],
    },
    "G4": {
        "name": "出海形式",
        "description": "企业出海方式",
        "levels": [
            {"code": "G4.L1.01", "name": "整车出口"},
            {"code": "G4.L1.02", "name": "投资建厂（KD/CKD/SKD）"},
            {"code": "G4.L1.03", "name": "并购/合资"},
            {"code": "G4.L1.04", "name": "技术授权/合作"},
            {"code": "G4.L1.05", "name": "供应链出海"},
            {"code": "G4.L1.06", "name": "服务贸易"},
        ],
    },
    "G5": {
        "name": "指标映射",
        "description": "支撑哪个评估维度",
        "levels": [
            {"code": "G5.L1.01", "name": "海外布局现状与趋势（D1）"},
            {"code": "G5.L1.02", "name": "与中国的双边关系（D2）"},
            {"code": "G5.L1.03", "name": "与美国及盟友的关系（D3）"},
            {"code": "G5.L1.04", "name": "政治稳定性与政权连续性（D4）"},
            {"code": "G5.L1.05", "name": "产业基础与配套能力（D5）"},
            {"code": "G5.L1.06", "name": "营商环境与合规要求（D6）"},
        ],
    },
    "G6": {
        "name": "风险标签",
        "description": "风险类型与级别",
        "levels": [
            {"code": "G6.L1.01", "name": "贸易摩擦/关税壁垒", "risk_level": "高"},
            {"code": "G6.L1.02", "name": "反倾销/反补贴调查", "risk_level": "高"},
            {"code": "G6.L1.03", "name": "政策变动", "risk_level": "中"},
            {"code": "G6.L1.04", "name": "汇率波动", "risk_level": "中"},
            {"code": "G6.L1.05", "name": "供应链中断", "risk_level": "高"},
            {"code": "G6.L1.06", "name": "地缘政治", "risk_level": "高"},
            {"code": "G6.L1.07", "name": "数据安全/合规", "risk_level": "中"},
        ],
    },
    "G7": {
        "name": "时效标签",
        "description": "信息时效性",
        "levels": [
            {"code": "G7.L1.01", "name": "实时（24小时内）"},
            {"code": "G7.L1.02", "name": "近期（1周内）"},
            {"code": "G7.L1.03", "name": "近期（1月内）"},
            {"code": "G7.L1.04", "name": "中期（1-6月）"},
            {"code": "G7.L1.05", "name": "长期（6月以上）"},
            {"code": "G7.L1.06", "name": "历史参考"},
        ],
    },
    "G8": {
        "name": "企业主体",
        "description": "涉及的企业",
        "levels": [
            {"code": "G8.L1.01", "name": "比亚迪"},
            {"code": "G8.L1.02", "name": "宁德时代"},
            {"code": "G8.L1.03", "name": "蔚来"},
            {"code": "G8.L1.04", "name": "小鹏"},
            {"code": "G8.L1.05", "name": "理想"},
            {"code": "G8.L1.06", "name": "吉利/极氪"},
            {"code": "G8.L1.07", "name": "上汽"},
            {"code": "G8.L1.08", "name": "奇瑞"},
            {"code": "G8.L1.09", "name": "长城"},
            {"code": "G8.L1.10", "name": "其他"},
        ],
    },
    "G9": {
        "name": "信息主题",
        "description": "内容主题分类",
        "levels": [
            {"code": "G9.L1.01", "name": "投资建厂"},
            {"code": "G9.L1.02", "name": "销量/市场数据"},
            {"code": "G9.L1.03", "name": "政策法规"},
            {"code": "G9.L1.04", "name": "贸易壁垒"},
            {"code": "G9.L1.05", "name": "技术合作"},
            {"code": "G9.L1.06", "name": "供应链"},
            {"code": "G9.L1.07", "name": "展会/活动"},
            {"code": "G9.L1.08", "name": "财报/业绩"},
            {"code": "G9.L1.09", "name": "人事/组织"},
            {"code": "G9.L1.10", "name": "产品发布"},
        ],
    },
    "G10": {
        "name": "政策工具",
        "description": "政策手段",
        "levels": [
            {"code": "G10.L1.01", "name": "关税/税收"},
            {"code": "G10.L1.02", "name": "补贴/激励"},
            {"code": "G10.L1.03", "name": "准入/认证"},
            {"code": "G10.L1.04", "name": "本地化要求"},
            {"code": "G10.L1.05", "name": "环保/碳排放"},
            {"code": "G10.L1.06", "name": "数据/安全审查"},
        ],
    },
    "G11": {
        "name": "数据类型",
        "description": "信息的数据性质",
        "levels": [
            {"code": "G11.L1.01", "name": "定量数据（含具体数字）"},
            {"code": "G11.L1.02", "name": "定性分析"},
            {"code": "G11.L1.03", "name": "一手信源"},
            {"code": "G11.L1.04", "name": "二手解读"},
        ],
    },
    "G12": {
        "name": "NEV相关性",
        "description": "与新能源汽车的相关度",
        "levels": [
            {"code": "G12.L1.01", "name": "NEV核心", "relevance": "direct"},
            {"code": "G12.L1.02", "name": "NEV产业链", "relevance": "industry"},
            {"code": "G12.L1.03", "name": "宏观/间接", "relevance": "industry"},
            {"code": "G12.L1.04", "name": "不相关", "relevance": "unrelated"},
        ],
    },
}


# ============================================================
# Prompt 模板
# ============================================================

TAGGING_PROMPT = """你是一位专业的出海情报分析师，负责对文章进行多维度标签标注。

## 任务
阅读以下文章，从 G1-G12 十二个维度中选择最相关的标签，并以 JSON 格式输出。

## 标签体系

G1 信源属性（信息来源可信度）:
- G1.L1.01 政府官网/国际组织 | G1.L1.02 行业协会/智库 | G1.L1.03 主流媒体 | G1.L1.04 企业官方 | G1.L1.05 自媒体/博客

G2 国别与区域:
- G2.L1.01 东南亚 | G2.L1.02 欧洲 | G2.L1.03 中东/非洲 | G2.L1.04 拉美 | G2.L1.05 北美 | G2.L1.06 中国

G3 产业链环节:
- G3.L1.01 整车制造 | G3.L1.02 动力电池 | G3.L1.03 电机电控 | G3.L1.04 智能驾驶 | G3.L1.05 充电设施 | G3.L1.06 上游材料 | G3.L1.07 零部件

G4 出海形式:
- G4.L1.01 整车出口 | G4.L1.02 投资建厂 | G4.L1.03 并购/合资 | G4.L1.04 技术授权 | G4.L1.05 供应链出海 | G4.L1.06 服务贸易

G5 指标映射（国别评分维度）:
- G5.L1.01 海外布局(D1) | G5.L1.02 双边关系(D2) | G5.L1.03 对美关系(D3) | G5.L1.04 政治稳定(D4) | G5.L1.05 产业基础(D5) | G5.L1.06 营商环境(D6)

G6 风险标签:
- G6.L1.01 贸易摩擦 | G6.L1.02 反倾销调查 | G6.L1.03 政策变动 | G6.L1.04 汇率波动 | G6.L1.05 供应链中断 | G6.L1.06 地缘政治 | G6.L1.07 数据安全

G7 时效标签:
- G7.L1.01 实时 | G7.L1.02 近1周 | G7.L1.03 近1月 | G7.L1.04 1-6月 | G7.L1.05 6月以上 | G7.L1.06 历史参考

G8 企业主体:
- G8.L1.01 比亚迪 | G8.L1.02 宁德时代 | G8.L1.03 蔚来 | G8.L1.04 小鹏 | G8.L1.05 理想 | G8.L1.06 吉利/极氪 | G8.L1.07 上汽 | G8.L1.08 奇瑞 | G8.L1.09 长城 | G8.L1.10 其他

G9 信息主题:
- G9.L1.01 投资建厂 | G9.L1.02 销量数据 | G9.L1.03 政策法规 | G9.L1.04 贸易壁垒 | G9.L1.05 技术合作 | G9.L1.06 供应链 | G9.L1.07 展会活动 | G9.L1.08 财报业绩 | G9.L1.09 人事组织 | G9.L1.10 产品发布

G10 政策工具:
- G10.L1.01 关税/税收 | G10.L1.02 补贴/激励 | G10.L1.03 准入/认证 | G10.L1.04 本地化要求 | G10.L1.05 环保/碳排放 | G10.L1.06 数据/安全审查

G11 数据类型:
- G11.L1.01 定量数据 | G11.L1.02 定性分析 | G11.L1.03 一手信源 | G11.L1.04 二手解读

G12 NEV相关性:
- G12.L1.01 NEV核心 | G12.L1.02 NEV产业链 | G12.L1.03 宏观/间接 | G12.L1.04 不相关

## 输出格式
必须严格返回 JSON，不要任何其他文字：

{
  "tags": [
    {"code": "G2.L1.01", "name": "东南亚", "confidence": 0.95},
    {"code": "G8.L1.01", "name": "比亚迪", "confidence": 0.88}
  ],
  "category_layer": "enterprise",
  "relevance": "direct",
  "reasoning": "简短说明标注理由"
}

## 字段说明
- category_layer: enterprise(企业级) / industry(行业级) / nation(国家级) / none(无)
- relevance: direct(直接相关) / industry(行业相关) / unrelated(不相关)
- confidence: 0-1 之间的置信度

## 文章信息
标题: {title}
来源: {source_name}
发布时间: {publish_date}

正文:
{content}
"""


@dataclass
class TagResult:
    """标签标注结果"""
    tags: list[dict[str, Any]]
    category_layer: str
    relevance: str
    reasoning: str
    confidence: float


def parse_tag_response(text: str) -> TagResult:
    """解析 LLM 返回的 JSON，容错处理"""
    # 尝试提取 JSON 块
    text = text.strip()
    
    # 去除 markdown 代码块标记
    if text.startswith("```"):
        lines = text.split("\n")
        # 找到第一个 { 和最后一个 }
        json_lines = []
        in_json = False
        for line in lines:
            if "{" in line and not in_json:
                in_json = True
            if in_json:
                json_lines.append(line)
            if "}" in line and in_json:
                break
        text = "\n".join(json_lines)
    
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # 尝试正则提取
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise ValueError(f"无法解析 LLM 响应: {text[:200]}")
    
    tags = data.get("tags", [])
    # 计算平均置信度
    confidences = [t.get("confidence", 0.5) for t in tags]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5
    
    return TagResult(
        tags=tags,
        category_layer=data.get("category_layer", "none"),
        relevance=data.get("relevance", "unrelated"),
        reasoning=data.get("reasoning", ""),
        confidence=round(avg_confidence, 2),
    )


def build_prompt(article: Article) -> str:
    """为单篇文章构建标注 Prompt"""
    content = (article.content or "")[:3000]  # 限制长度
    return TAGGING_PROMPT.format(
        title=article.title,
        source_name=article.source_name,
        publish_date=str(article.publish_date) if article.publish_date else "未知",
        content=content,
    )


def tag_article(
    title: str,
    content: str = "",
    source_name: str = "",
    publish_date: str = "",
    llm_client=None,
) -> TagResult:
    """
    对单篇文章进行 LLM 标注
    
    Args:
        title: 文章标题
        content: 文章正文（可选）
        source_name: 来源名称
        publish_date: 发布日期
        llm_client: LLM 客户端（如 OpenAI/DeepSeek/Qwen）
    
    Returns:
        TagResult 标注结果
    """
    if llm_client is None:
        # 如果没有提供 LLM 客户端，返回基于关键词的简单规则标注
        return _rule_based_tag(title, content, source_name)
    
    prompt = TAGGING_PROMPT.format(
        title=title,
        source_name=source_name,
        publish_date=publish_date or "未知",
        content=content[:3000],
    )
    
    # 调用 LLM（由外部注入客户端）
    response = llm_client.complete(prompt)
    return parse_tag_response(response)


def _rule_based_tag(title: str, content: str, source_name: str) -> TagResult:
    """基于关键词规则的快速标注（无 LLM 时降级使用）"""
    text = (title + " " + content).lower()
    tags = []
    
    # G2 国别
    country_keywords = {
        "G2.L1.01": ["泰国", "泰", "印尼", "印度尼西亚", "越南", "马来", "菲律宾", "新加坡", "东南亚"],
        "G2.L1.02": ["匈牙利", "德国", "西班牙", "法国", "意大利", "波兰", "欧洲"],
        "G2.L1.03": ["土耳其", "埃及", "沙特", "阿联酋", "南非", "中东", "非洲"],
        "G2.L1.04": ["墨西哥", "巴西", "阿根廷", "智利", "拉美", "拉丁美洲"],
        "G2.L1.05": ["美国", "加拿大", "北美"],
        "G2.L1.06": ["中国", "国内"],
    }
    for code, keywords in country_keywords.items():
        if any(kw in text for kw in keywords):
            tags.append({"code": code, "name": _get_tag_name(code), "confidence": 0.7})
    
    # G8 企业
    company_keywords = {
        "G8.L1.01": ["比亚迪"],
        "G8.L1.02": ["宁德时代", "CATL"],
        "G8.L1.03": ["蔚来", "NIO"],
        "G8.L1.04": ["小鹏", "Xpeng"],
        "G8.L1.05": ["理想", "Li Auto"],
        "G8.L1.06": ["吉利", "极氪", "Zeekr"],
        "G8.L1.07": ["上汽"],
        "G8.L1.08": ["奇瑞"],
        "G8.L1.09": ["长城"],
    }
    for code, keywords in company_keywords.items():
        if any(kw in text for kw in keywords):
            tags.append({"code": code, "name": _get_tag_name(code), "confidence": 0.85})
    
    # G4 出海形式
    if "建厂" in text or "投资" in text:
        tags.append({"code": "G4.L1.02", "name": "投资建厂", "confidence": 0.7})
    elif "出口" in text:
        tags.append({"code": "G4.L1.01", "name": "整车出口", "confidence": 0.7})
    
    # G9 主题
    if "反倾销" in text or "反补贴" in text or "关税" in text:
        tags.append({"code": "G9.L1.04", "name": "贸易壁垒", "confidence": 0.8})
    elif "建厂" in text:
        tags.append({"code": "G9.L1.01", "name": "投资建厂", "confidence": 0.75})
    elif "销量" in text or "销售" in text:
        tags.append({"code": "G9.L1.02", "name": "销量数据", "confidence": 0.7})
    
    # G12 NEV 相关性
    nev_keywords = ["新能源", "电动车", "电动汽车", "EV", "电池", "出海", "比亚迪", "宁德时代"]
    if any(kw in text for kw in nev_keywords):
        relevance = "direct"
        tags.append({"code": "G12.L1.01", "name": "NEV核心", "confidence": 0.8})
    else:
        relevance = "industry"
    
    # 推断层级
    if any(t["code"].startswith("G8") for t in tags):
        layer = "enterprise"
    elif any(t["code"].startswith("G2") for t in tags):
        layer = "nation"
    else:
        layer = "industry"
    
    confidences = [t.get("confidence", 0.5) for t in tags]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.5
    
    return TagResult(
        tags=tags,
        category_layer=layer,
        relevance=relevance,
        reasoning="基于关键词规则自动标注",
        confidence=round(avg_conf, 2),
    )


def _get_tag_name(code: str) -> str:
    """根据标签代码获取名称"""
    group = code.split(".")[0]
    if group in TAG_SCHEMA:
        for level in TAG_SCHEMA[group].get("levels", []):
            if level.get("code") == code:
                return level.get("name", code)
    return code


def batch_tag_articles(
    db: Session,
    limit: int = 100,
    llm_client=None,
    dry_run: bool = False,
) -> dict:
    """
    批量标注未标注文章
    
    Args:
        db: 数据库会话
        limit: 本次处理数量
        llm_client: LLM 客户端（为 None 则使用规则标注）
        dry_run: 仅预览不写入数据库
    
    Returns:
        统计信息
    """
    # 查询未标注的文章（category_layer 为空的）
    articles = (
        db.query(Article)
        .filter(
            (Article.category_layer == None) | (Article.category_layer == "")
        )
        .limit(limit)
        .all()
    )
    
    stats = {"total": len(articles), "success": 0, "failed": 0, "tags_applied": 0}
    
    for article in articles:
        try:
            result = tag_article(
                title=article.title,
                content=article.content or "",
                source_name=article.source_name,
                publish_date=str(article.publish_date) if article.publish_date else "",
                llm_client=llm_client,
            )
            
            if not dry_run:
                article.category_layer = result.category_layer
                article.relevance = result.relevance
                article.category_tag = ",".join(
                    [f"{t['code']}:{t['name']}" for t in result.tags[:5]]
                )
                db.commit()
            
            stats["success"] += 1
            stats["tags_applied"] += len(result.tags)
            
        except Exception as e:
            stats["failed"] += 1
            print(f"标注失败 [id={article.id}]: {e}")
    
    return stats


# ============================================================
# 本体关系抽取
# ============================================================

RELATION_PROMPT = """从以下文章中抽取出海相关的主体-关系-客体三元组。

可抽取的关系类型：
- 出海投资建厂（企业→国家）
- 出海经营（企业→国家）
- 贸易壁垒（国家→企业/产品）
- 供应链合作（企业→企业）
- 技术合作（企业→企业/国家）

输出格式（JSON）：
{
  "relations": [
    {
      "rel_type": "出海投资建厂",
      "from_obj": "比亚迪",
      "to_obj": "泰国",
      "attributes": {"时间": "2024-01", "金额": "38亿元", "方式": "独资建厂"},
      "confidence": "高"
    }
  ]
}

文章：
标题: {title}
正文: {content}
"""


def extract_relations(
    title: str,
    content: str,
    article_id: int,
    llm_client=None,
) -> list[dict]:
    """从文章中抽取关系三元组"""
    if llm_client is None:
        # 规则降级
        return _rule_extract_relations(title, content, article_id)
    
    prompt = RELATION_PROMPT.format(title=title, content=content[:3000])
    response = llm_client.complete(prompt)
    
    try:
        data = json.loads(response)
        return data.get("relations", [])
    except (json.JSONDecodeError, ValueError):
        return []


def _rule_extract_relations(title: str, content: str, article_id: int) -> list[dict]:
    """基于规则的简单关系抽取"""
    text = title + " " + content
    relations = []
    
    # 投资建厂模式
    import re
    pattern = r"(比亚迪|宁德时代|蔚来|小鹏|理想|吉利|上汽|奇瑞|长城).*?(泰国|印尼|越南|匈牙利|德国|西班牙|墨西哥|巴西).*?(建厂|投资|工厂)"
    matches = re.findall(pattern, text)
    for m in matches:
        relations.append({
            "rel_type": "出海投资建厂",
            "from_obj": m[0],
            "to_obj": m[1],
            "attributes": {"依据": "文章标题+正文匹配"},
            "confidence": "中",
            "source_article_id": article_id,
            "category": "NEV核心",
        })
    
    return relations


def save_relations(db: Session, relations: list[dict]) -> int:
    """将抽取的关系保存到数据库"""
    count = 0
    for rel_data in relations:
        rel = Relation(
            rel_id=f"REL-{rel_data['from_obj']}-{rel_data['to_obj']}-{count}",
            rel_type=rel_data.get("rel_type", "未知"),
            from_obj=rel_data.get("from_obj", ""),
            to_obj=rel_data.get("to_obj", ""),
            attributes_json=rel_data.get("attributes", {}),
            source_article_id=rel_data.get("source_article_id"),
            confidence=rel_data.get("confidence", "中"),
            category=rel_data.get("category", "其他"),
        )
        db.add(rel)
        count += 1
    
    db.commit()
    return count
