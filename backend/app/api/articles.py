# -*- coding: utf-8 -*-
"""文章相关 API"""

from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, or_, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Article
from app.schemas import ArticleFilter, ArticleListResponse, ArticleResponse

router = APIRouter(prefix="/articles", tags=["文章"])


@router.get("", response_model=ArticleListResponse)
def list_articles(
    q: str | None = None,
    source_id: int | None = None,
    layer: str | None = None,
    relevance: str | None = None,
    tag: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取文章列表，支持多维度筛选"""
    query = db.query(Article)

    # 全文搜索
    if q:
        # 使用 PostgreSQL 全文检索
        tsquery = func.plainto_tsquery("chinese", q)
        query = query.filter(
            or_(
                func.to_tsvector("chinese", Article.title).op("@@")(tsquery),
                func.to_tsvector("chinese", func.coalesce(Article.content, "")).op("@@")(tsquery),
                Article.title.ilike(f"%{q}%"),
            )
        )

    if source_id:
        query = query.filter(Article.source_id == source_id)
    if layer:
        query = query.filter(Article.category_layer == layer)
    if relevance:
        query = query.filter(Article.relevance == relevance)
    if date_from:
        query = query.filter(Article.publish_date >= date_from)
    if date_to:
        query = query.filter(Article.publish_date <= date_to)

    # 标签筛选（通过 article_tags 关联表，此处简化处理）
    if tag:
        query = query.filter(Article.category_tag.ilike(f"%{tag}%"))

    total = query.count()
    items = (
        query.order_by(desc(Article.publish_date), desc(Article.crawled_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return ArticleListResponse(total=total, items=items)


@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(article_id: int, db: Session = Depends(get_db)):
    """获取单篇文章详情"""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")
    return article


@router.get("/recent/days")
def get_recent_stats(days: int = Query(7, ge=1, le=90), db: Session = Depends(get_db)):
    """获取最近 N 天的文章统计"""
    cutoff = date.today() - timedelta(days=days)

    total = db.query(Article).filter(Article.publish_date >= cutoff).count()

    by_layer = (
        db.query(Article.category_layer, func.count(Article.id).label("count"))
        .filter(Article.publish_date >= cutoff)
        .group_by(Article.category_layer)
        .all()
    )

    by_source = (
        db.query(Article.source_name, func.count(Article.id).label("count"))
        .filter(Article.publish_date >= cutoff)
        .group_by(Article.source_name)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )

    daily = (
        db.query(Article.publish_date, func.count(Article.id).label("count"))
        .filter(Article.publish_date >= cutoff)
        .group_by(Article.publish_date)
        .order_by(Article.publish_date)
        .all()
    )

    return {
        "days": days,
        "total": total,
        "by_layer": [{"layer": r[0] or "none", "count": r[1]} for r in by_layer],
        "by_source": [{"name": r[0], "count": r[1]} for r in by_source],
        "daily": [{"date": str(r[0]), "count": r[1]} for r in daily],
    }
