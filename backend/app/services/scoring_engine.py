# -*- coding: utf-8 -*-
"""
国别评分引擎（引擎三）

基于文章数据自动计算国别出海评分：
1. 统计各国文章数量与维度分布
2. 按信源权威性加权
3. 按风险标签减分
4. 归一化到0-100分

维度（D1-D6）：
- D1 海外布局现状与趋势 (weight=0.15)
- D2 与中国的双边关系 (weight=0.20)
- D3 与美国及盟友的关系 (weight=0.15)
- D4 政治稳定性与政权连续性 (weight=0.15)
- D5 产业基础与配套能力 (weight=0.20)
- D6 营商环境与合规要求 (weight=0.15)
"""

from collections import defaultdict
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models import Article, CountryScore

# 维度配置
DIMENSIONS = {
    "d1": {"name": "海外布局现状与趋势", "weight": 0.15},
    "d2": {"name": "与中国的双边关系", "weight": 0.20},
    "d3": {"name": "与美国及盟友的关系", "weight": 0.15},
    "d4": {"name": "政治稳定性与政权连续性", "weight": 0.15},
    "d5": {"name": "产业基础与配套能力", "weight": 0.20},
    "d6": {"name": "营商环境与合规要求", "weight": 0.15},
}

# 国家代码映射
COUNTRY_MAP = {
    "中国": {"code": "CN", "name": "中国"},
    "东南亚": {"code": "SEA", "name": "东南亚"},
    "泰国": {"code": "TH", "name": "泰国"},
    "印尼": {"code": "ID", "name": "印度尼西亚"},
    "越南": {"code": "VN", "name": "越南"},
    "马来": {"code": "MY", "name": "马来西亚"},
    "菲律宾": {"code": "PH", "name": "菲律宾"},
    "新加坡": {"code": "SG", "name": "新加坡"},
    "欧洲": {"code": "EU", "name": "欧洲"},
    "匈牙利": {"code": "HU", "name": "匈牙利"},
    "德国": {"code": "DE", "name": "德国"},
    "西班牙": {"code": "ES", "name": "西班牙"},
    "法国": {"code": "FR", "name": "法国"},
    "意大利": {"code": "IT", "name": "意大利"},
    "波兰": {"code": "PL", "name": "波兰"},
    "中东/非洲": {"code": "MEA", "name": "中东/非洲"},
    "土耳其": {"code": "TR", "name": "土耳其"},
    "埃及": {"code": "EG", "name": "埃及"},
    "沙特": {"code": "SA", "name": "沙特阿拉伯"},
    "阿联酋": {"code": "AE", "name": "阿联酋"},
    "南非": {"code": "ZA", "name": "南非"},
    "拉美": {"code": "LAT", "name": "拉美"},
    "墨西哥": {"code": "MX", "name": "墨西哥"},
    "巴西": {"code": "BR", "name": "巴西"},
    "阿根廷": {"code": "AR", "name": "阿根廷"},
    "智利": {"code": "CL", "name": "智利"},
    "北美": {"code": "NA", "name": "北美"},
    "美国": {"code": "US", "name": "美国"},
    "加拿大": {"code": "CA", "name": "加拿大"},
    "日本": {"code": "JP", "name": "日本"},
    "韩国": {"code": "KR", "name": "韩国"},
    "印度": {"code": "IN", "name": "印度"},
    "澳大利亚": {"code": "AU", "name": "澳大利亚"},
    "俄罗斯": {"code": "RU", "name": "俄罗斯"},
}

# G5标签 → 维度映射
G5_TO_DIMENSION = {
    "G5.L1.01": "d1",  # 海外布局现状与趋势
    "G5.L1.02": "d2",  # 与中国的双边关系
    "G5.L1.03": "d3",  # 与美国及盟友的关系
    "G5.L1.04": "d4",  # 政治稳定性与政权连续性
    "G5.L1.05": "d5",  # 产业基础与配套能力
    "G5.L1.06": "d6",  # 营商环境与合规要求
}

# 信源权重
SOURCE_WEIGHTS = {
    "政府官网/国际组织": 1.0,
    "行业协会/智库": 0.9,
    "主流媒体": 0.8,
    "企业官方": 0.85,
    "自媒体/博客": 0.5,
}

# 等级划分
LEVELS = [
    {"min": 90, "max": 100, "label": "强烈推荐"},
    {"min": 75, "max": 89, "label": "推荐"},
    {"min": 60, "max": 74, "label": "谨慎推荐"},
    {"min": 40, "max": 59, "label": "不推荐"},
    {"min": 0, "max": 39, "label": "暂不推荐"},
]


def calculate_level(score: float) -> str:
    """根据总分计算等级"""
    for level in LEVELS:
        if level["min"] <= score <= level["max"]:
            return level["label"]
    return "暂不推荐"


def _extract_country_from_tags(article: Article) -> list[dict]:
    """从文章标签中提取国家信息"""
    if not article.category_tag:
        return []
    
    countries = []
    for tag in article.category_tag.split(","):
        code = tag.split(":")[0] if ":" in tag else tag
        name = tag.split(":")[1] if ":" in tag else ""
        
        # G2.L1.XX 格式
        if code.startswith("G2"):
            countries.append({"code": code, "name": name})
    return countries


def _extract_dimensions_from_tags(article: Article) -> list[str]:
    """从文章标签中提取维度信息"""
    if not article.category_tag:
        return []
    
    dims = []
    for tag in article.category_tag.split(","):
        code = tag.split(":")[0] if ":" in tag else tag
        if code in G5_TO_DIMENSION:
            dims.append(G5_TO_DIMENSION[code])
    return dims


def _get_article_weight(article: Article) -> float:
    """计算单篇文章的权重（基于信源）"""
    # 简单启发式：根据source_name判断权重
    source_name = (article.source_name or "").lower()
    
    if any(k in source_name for k in ["政府", "gov.cn", "mofcom", "miit"]):
        return 1.0
    elif any(k in source_name for k in ["协会", "研究院", "智库", "学会"]):
        return 0.9
    elif any(k in source_name for k in ["新闻", "日报", "财经", "证券", "时报"]):
        return 0.8
    elif any(k in source_name for k in ["企业", "公司", "官方"]):
        return 0.85
    else:
        return 0.7


def _get_country_code_from_name(name: str) -> dict | None:
    """根据国家名称获取代码"""
    for key, info in COUNTRY_MAP.items():
        if key in name:
            return info
    return None


def calculate_country_scores(db: Session, industry: str = "NEV") -> list[dict]:
    """
    计算所有国家的出海评分
    
    Args:
        db: 数据库会话
        industry: 行业（默认NEV）
    
    Returns:
        各国评分结果列表
    """
    # 获取所有已标注文章
    articles = db.query(Article).filter(
        Article.category_tag != None,
        Article.category_tag != "",
    ).all()
    
    # 按国家聚合数据
    country_data = defaultdict(lambda: {
        "articles": [],
        "dimension_scores": defaultdict(float),
        "risk_count": 0,
        "total_weight": 0,
    })
    
    for article in articles:
        countries = _extract_country_from_tags(article)
        dims = _extract_dimensions_from_tags(article)
        weight = _get_article_weight(article)
        
        # 风险标签计数
        has_risk = article.category_tag and "G6" in article.category_tag
        
        for country in countries:
            country_name = country["name"]
            info = _get_country_code_from_name(country_name)
            if not info:
                continue
            
            code = info["code"]
            country_data[code]["articles"].append(article.id)
            country_data[code]["total_weight"] += weight
            
            # 维度分数累加
            for dim in dims:
                country_data[code]["dimension_scores"][dim] += weight
            
            # 如果没有维度标签，默认给D1（海外布局）加分
            if not dims:
                country_data[code]["dimension_scores"]["d1"] += weight * 0.5
            
            if has_risk:
                country_data[code]["risk_count"] += 1
    
    results = []
    
    for code, data in country_data.items():
        info = next((v for v in COUNTRY_MAP.values() if v["code"] == code), None)
        if not info:
            continue
        
        article_count = len(data["articles"])
        if article_count < 2:
            continue  # 文章太少不计算
        
        # 计算各维度原始分数（基于文章加权数量）
        dim_raw = {}
        for dim_code, dim_info in DIMENSIONS.items():
            raw_score = data["dimension_scores"].get(dim_code, 0)
            # 归一化：假设最高分的国家为基准
            dim_raw[dim_code] = raw_score
        
        # 找到该维度在所有国家中的最大值，用于归一化
        all_dim_max = {dim: max(
            country_data[c]["dimension_scores"].get(dim, 0)
            for c in country_data
        ) for dim in DIMENSIONS.keys()}
        
        # 计算各维度分数（0-100）
        dimension_scores = {}
        for dim_code, dim_info in DIMENSIONS.items():
            max_val = all_dim_max.get(dim_code, 1)
            if max_val == 0:
                score = 50  # 无数据时给中性分
            else:
                raw = data["dimension_scores"].get(dim_code, 0)
                # 基础分40 + 按相对比例分配60分
                score = 40 + (raw / max_val) * 60
            
            # 风险惩罚（每条风险新闻扣2分，最多扣10分）
            risk_penalty = min(data["risk_count"] * 2, 10)
            score = max(0, score - risk_penalty)
            
            dimension_scores[dim_code] = round(score, 1)
        
        # 加权总分
        total = sum(
            dimension_scores[dim] * dim_info["weight"]
            for dim, dim_info in DIMENSIONS.items()
        )
        
        # 文章数量加成（文章越多，分数越可信，小幅加分）
        volume_bonus = min(article_count * 0.5, 5)
        total = min(100, total + volume_bonus)
        
        total = round(total, 1)
        
        # 36子项（简化版：每维度6个子项）
        subitems = {}
        for dim_code, dim_info in DIMENSIONS.items():
            base = dimension_scores[dim_code]
            subitems[dim_code] = {
                f"{dim_code}_s{i}": round(base * (0.8 + 0.05 * i), 1)
                for i in range(1, 7)
            }
        
        results.append({
            "country_code": code,
            "country_name": info["name"],
            "industry": industry,
            "score_total": total,
            "score_level": calculate_level(total),
            "dimension_scores": dimension_scores,
            "subitem_scores": subitems,
            "article_count": article_count,
            "risk_count": data["risk_count"],
        })
    
    # 按总分排序
    results.sort(key=lambda x: x["score_total"], reverse=True)
    return results


def save_country_scores(db: Session, scores: list[dict]) -> int:
    """将评分结果保存到数据库"""
    count = 0
    for score_data in scores:
        score = CountryScore(
            country_code=score_data["country_code"],
            country_name=score_data["country_name"],
            industry=score_data["industry"],
            score_total=score_data["score_total"],
            score_level=score_data["score_level"],
            dimension_scores=score_data["dimension_scores"],
            subitem_scores=score_data["subitem_scores"],
            scored_at=date.today(),
        )
        db.add(score)
        count += 1
    
    db.commit()
    return count


def refresh_all_scores(db: Session, industry: str = "NEV") -> dict:
    """
    刷新所有国别评分
    
    Returns:
        {"calculated": int, "saved": int, "top3": list}
    """
    scores = calculate_country_scores(db, industry)
    
    # 清除旧评分（保留历史）
    # 注意：这里不清除，直接插入新记录，保留历史版本
    
    saved = save_country_scores(db, scores)
    
    return {
        "calculated": len(scores),
        "saved": saved,
        "top3": [
            {"code": s["country_code"], "name": s["country_name"], "score": s["score_total"], "level": s["score_level"]}
            for s in scores[:3]
        ],
    }
