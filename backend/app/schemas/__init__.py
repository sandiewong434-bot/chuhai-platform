# -*- coding: utf-8 -*-
"""Pydantic Schema 定义"""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


# ============================================================
# 文章相关
# ============================================================

class ArticleBase(BaseModel):
    title: str
    url: str
    publish_date: date | None = None
    relevance: str | None = None
    category_layer: str | None = None
    category_tag: str | None = None


class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    source_name: str
    crawled_at: datetime
    content: str | None = None


class ArticleListResponse(BaseModel):
    total: int
    items: list[ArticleResponse]


class ArticleFilter(BaseModel):
    q: str | None = None                    # 关键词搜索
    source_id: int | None = None
    layer: str | None = None                # enterprise/industry/nation/none
    relevance: str | None = None            # direct/industry/unrelated
    tag: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    page: int = 1
    size: int = 20


# ============================================================
# 本体相关
# ============================================================

class ObjectEntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    obj_id: str
    obj_type: str
    name: str
    attributes_json: dict | None = None
    source_libraries: str | None = None


class RelationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    rel_id: str
    rel_type: str
    from_obj: str
    to_obj: str
    attributes_json: dict | None = None
    source_article_id: int | None = None
    confidence: str | None = None
    category: str | None = None


class OntologyFilter(BaseModel):
    obj_type: str | None = None             # 企业 / 目的国 / 产品
    rel_type: str | None = None
    from_obj: str | None = None
    to_obj: str | None = None
    page: int = 1
    size: int = 20


# ============================================================
# 信源相关
# ============================================================

class SourceHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source_id: int
    name: str
    is_active: bool
    library: str | None = None
    crawl_tier: str | None = None
    network_issue: bool = False
    last_run_at: datetime | None = None
    last_new_count: int = 0
    week_count: int = 0


class SourceLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    source_name: str
    run_at: datetime
    status: str | None = None
    new_count: int = 0
    error_message: str | None = None
    duration_sec: int | None = None


# ============================================================
# 搜索相关
# ============================================================

class SearchRequest(BaseModel):
    q: str | None = None
    filters: dict[str, Any] | None = None
    page: int = 1
    size: int = 20


class SearchResponse(BaseModel):
    total: int
    items: list[ArticleResponse]
    facets: dict[str, Any] | None = None


# ============================================================
# 国别评分相关
# ============================================================

class ScoreRequest(BaseModel):
    country_code: str
    industry: str = "NEV"


class ScoreDimension(BaseModel):
    d1: float | None = None      # 海外布局现状与趋势
    d2: float | None = None      # 与中国的双边关系
    d3: float | None = None      # 与美国及盟友的关系
    d4: float | None = None      # 政治稳定性与政权连续性
    d5: float | None = None      # 产业基础与配套能力
    d6: float | None = None      # 营商环境与合规要求


class ScoreResponse(BaseModel):
    country_code: str
    country_name: str
    industry: str
    score_total: float
    score_level: str                    # 强烈推荐 / 推荐 / 谨慎推荐 / 不推荐 / 暂不推荐
    dimensions: ScoreDimension
    subitems: dict[str, Any] | None = None
    scored_at: date
