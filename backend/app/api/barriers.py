# -*- coding: utf-8 -*-
"""贸易壁垒相关 API

从已标注文章中提取贸易壁垒相关案件信息
"""

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Article

router = APIRouter(prefix="/barriers", tags=["贸易壁垒"])


# 贸易壁垒相关的关键词（用于从文章中提取）
BARRIER_KEYWORDS = ["反倾销", "反补贴", "关税", "贸易壁垒", "301", "232", "双反"]
BARRIER_COUNTRIES = ["美国", "欧盟", "土耳其", "印度", "巴西", "墨西哥", "泰国", "印尼", "越南"]


def extract_barrier_type(title: str) -> str:
    """从标题中提取壁垒类型"""
    if "反倾销" in title:
        return "反倾销调查"
    if "反补贴" in title:
        return "反补贴调查"
    if "关税" in title or "301" in title or "232" in title:
        return "关税措施"
    if "壁垒" in title:
        return "贸易壁垒"
    return "其他"


def extract_country(title: str, content: str = "") -> str:
    """从标题/内容中提取涉及国家"""
    text = title + content
    for c in BARRIER_COUNTRIES:
        if c in text:
            return c
    return "未知"


def is_nev_related(title: str, content: str = "") -> bool:
    """判断是否NEV相关"""
    text = title + content
    nev_keywords = ["新能源", "电动汽车", "电动车", "EV", "电池", "光伏", "锂电"]
    return any(kw in text for kw in nev_keywords)


@router.get("")
def list_barriers(
    q: str | None = None,
    country: str | None = None,
    barrier_type: str | None = None,
    only_nev: bool = Query(False, description="仅NEV相关"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取贸易壁垒案件列表"""
    # 从文章中筛选贸易壁垒相关内容
    query = db.query(Article)

    # 关键词筛选
    keyword_conditions = []
    for kw in BARRIER_KEYWORDS:
        keyword_conditions.append(Article.title.ilike(f"%{kw}%"))
        keyword_conditions.append(Article.content.ilike(f"%{kw}%"))

    query = query.filter(or_(*keyword_conditions))

    # 标签筛选（G9.L1.04 是贸易壁垒标签）
    query = query.filter(
        or_(
            Article.category_tag.ilike("%G9.L1.04%"),
            Article.category_tag.ilike("%贸易壁垒%"),
            *keyword_conditions
        )
    )

    if q:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{q}%"),
                Article.content.ilike(f"%{q}%"),
            )
        )

    # 国家筛选（在标题/内容中匹配）
    if country:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{country}%"),
                Article.content.ilike(f"%{country}%"),
            )
        )

    total = query.count()

    items = (
        query.order_by(desc(Article.publish_date), desc(Article.crawled_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # 转换为贸易壁垒格式
    results = []
    for article in items:
        title = article.title or ""
        content = article.content or ""

        bt = barrier_type or extract_barrier_type(title)
        # 如果指定了类型但不匹配，跳过
        if barrier_type and extract_barrier_type(title) != barrier_type:
            continue

        nev = is_nev_related(title, content)
        if only_nev and not nev:
            continue

        results.append({
            "id": article.id,
            "title": title,
            "country": extract_country(title, content),
            "type": extract_barrier_type(title),
            "status": "进行中",  # 简化处理，后续可从内容解析
            "date": str(article.publish_date) if article.publish_date else None,
            "nev_related": nev,
            "description": content[:300] if content else title,
            "source_name": article.source_name,
            "url": article.url,
        })

    return {
        "total": len(results),
        "items": results,
        "page": page,
        "size": size,
    }


@router.get("/stats")
def get_barrier_stats(db: Session = Depends(get_db)):
    """贸易壁垒统计"""
    # 按类型统计
    keyword_conditions = []
    for kw in BARRIER_KEYWORDS:
        keyword_conditions.append(Article.title.ilike(f"%{kw}%"))

    base_query = db.query(Article).filter(or_(*keyword_conditions))

    total = base_query.count()

    # 最近30天
    from datetime import timedelta
    month_ago = date.today() - timedelta(days=30)
    recent = base_query.filter(Article.publish_date >= month_ago).count()

    # NEV相关
    nev_keywords = ["新能源", "电动汽车", "电动车", "EV", "电池"]
    nev_conditions = []
    for kw in nev_keywords:
        nev_conditions.append(Article.title.ilike(f"%{kw}%"))
    nev_count = base_query.filter(or_(*nev_conditions)).count()

    return {
        "total_cases": total,
        "recent_30d": recent,
        "nev_related": nev_count,
    }
