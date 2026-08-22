# -*- coding: utf-8 -*-
"""API 路由聚合"""

from app.api.articles import router as articles_router
from app.api.barriers import router as barriers_router
from app.api.enterprises import router as enterprises_router
from app.api.objects import router as ontology_router
from app.api.search import router as search_router
from app.api.sources import router as sources_router
from app.api.score import router as score_router

__all__ = [
    "articles_router",
    "barriers_router",
    "enterprises_router",
    "ontology_router",
    "search_router",
    "sources_router",
    "score_router",
]
