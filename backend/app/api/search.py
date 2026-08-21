# -*- coding: utf-8 -*-
"""搜索 API"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Article
from app.schemas import ArticleResponse, SearchResponse

router = APIRouter(prefix="/search", tags=["搜索"])


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    source_id: int | None = None,
    layer: str | None = None,
    relevance: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """全文搜索 + 多维度筛选

    搜索范围：标题 + 正文
    支持 PostgreSQL 全文检索（中文）
    """
    query = db.query(Article)

    # 全文检索
    if q:
        tsquery = func.plainto_tsquery("chinese", q)
        query = query.filter(
            or_(
                func.to_tsvector("chinese", Article.title).op("@@")(tsquery),
                func.to_tsvector("chinese", func.coalesce(Article.content, "")).op("@@")(tsquery),
            )
        )

    # 筛选条件
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

    total = query.count()

    items = (
        query.order_by(desc(Article.publish_date), desc(Article.crawled_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # 生成聚合面（facets）
    facets = {}
    if total > 0:
        layer_facets = (
            db.query(Article.category_layer, func.count(Article.id).label("count"))
            .filter(Article.id.in_([a.id for a in items]))
            .group_by(Article.category_layer)
            .all()
        )
        facets["layer"] = [{"value": r[0] or "none", "count": r[1]} for r in layer_facets]

    return SearchResponse(total=total, items=items, facets=facets or None)
