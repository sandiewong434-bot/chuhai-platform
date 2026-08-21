# -*- coding: utf-8 -*-
"""SQLAlchemy 模型定义"""

from datetime import datetime

from sqlalchemy import JSON, Date, DateTime, Integer, Numeric, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Article(Base):
    """文章主表"""

    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(Integer, nullable=False)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    publish_date: Mapped[datetime | None] = mapped_column(Date)
    unique_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    crawled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    relevance: Mapped[str | None] = mapped_column(String(20))
    category_layer: Mapped[str | None] = mapped_column(String(20))
    category_tag: Mapped[str | None] = mapped_column(String(500))
    content: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ObjectEntity(Base):
    """本体对象表"""

    __tablename__ = "objects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    obj_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    obj_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    attributes_json: Mapped[dict | None] = mapped_column(JSON)
    source_libraries: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Relation(Base):
    """关系表"""

    __tablename__ = "relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rel_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    rel_type: Mapped[str] = mapped_column(String(50), nullable=False)
    from_obj: Mapped[str] = mapped_column(String(200), nullable=False)
    to_obj: Mapped[str] = mapped_column(String(200), nullable=False)
    attributes_json: Mapped[dict | None] = mapped_column(JSON)
    source_article_id: Mapped[int | None] = mapped_column(Integer)
    confidence: Mapped[str | None] = mapped_column(String(20))
    category: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class SourceLog(Base):
    """信源日志表"""

    __tablename__ = "source_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(Integer, nullable=False)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    run_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    status: Mapped[str | None] = mapped_column(String(20))
    new_count: Mapped[int] = mapped_column(Integer, default=0)
    total_fetched: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    duration_sec: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class CountryScore(Base):
    """国别评分表"""

    __tablename__ = "country_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    country_code: Mapped[str] = mapped_column(String(10), nullable=False)
    country_name: Mapped[str] = mapped_column(String(100), nullable=False)
    industry: Mapped[str] = mapped_column(String(50), nullable=False)
    score_total: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    score_level: Mapped[str] = mapped_column(String(20), nullable=False)
    dimension_scores: Mapped[dict | None] = mapped_column(JSON)
    subitem_scores: Mapped[dict | None] = mapped_column(JSON)
    scored_at: Mapped[datetime] = mapped_column(Date, nullable=False, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class SourceConfig(Base):
    """信源配置表"""

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    org_type: Mapped[str | None] = mapped_column(String(100))
    column_name: Mapped[str | None] = mapped_column(String(200))
    list_url: Mapped[str | None] = mapped_column(Text)
    content_format: Mapped[str | None] = mapped_column(String(50))
    access_method: Mapped[str | None] = mapped_column(String(50))
    unique_id_rule: Mapped[str | None] = mapped_column(Text)
    access_restriction: Mapped[str | None] = mapped_column(Text)
    update_freq: Mapped[str | None] = mapped_column(String(50))
    target_db: Mapped[str | None] = mapped_column(String(200))
    nev_relevance: Mapped[str | None] = mapped_column(String(50))
    authority: Mapped[str | None] = mapped_column(String(50))
    compliance: Mapped[str | None] = mapped_column(Text)
    crawl_tier: Mapped[str | None] = mapped_column(String(50))
    library: Mapped[str | None] = mapped_column(String(50))
    category_layer: Mapped[str | None] = mapped_column(String(20))
    category_tag: Mapped[str | None] = mapped_column(String(200))
    network_issue: Mapped[bool] = mapped_column(Boolean, default=False)
    selectors: Mapped[dict | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
