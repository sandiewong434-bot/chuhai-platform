# -*- coding: utf-8 -*-
"""数据库连接管理

支持 PostgreSQL（生产）和 SQLite（本地开发自动回退）
"""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# 检测数据库URL，PostgreSQL不可用时自动回退到SQLite
database_url = settings.DATABASE_URL

if database_url.startswith("postgresql"):
    try:
        # 用psycopg2直接测试PostgreSQL连接（更可靠，超时可控）
        import psycopg2
        conn = psycopg2.connect(database_url, connect_timeout=5)
        conn.close()
    except Exception:
        # PostgreSQL不可用，回退到SQLite
        sqlite_path = Path(__file__).parent.parent.parent / "chuhai_dev.db"
        database_url = f"sqlite:///{sqlite_path}"
        print(f"[DB] PostgreSQL不可用，自动回退到SQLite: {sqlite_path}")

# 创建引擎
if database_url.startswith("sqlite"):
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        database_url,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,
        echo=settings.DEBUG,
    )

# Session 工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 模型基类
Base = declarative_base()


def get_db():
    """FastAPI Dependency：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库（创建所有表）"""
    from app.models import (
        Article, ObjectEntity, Relation, SourceLog, CountryScore, SourceConfig,
        IndicatorSeries, IndicatorPoint, DataCollectionLog,
    )
    Base.metadata.create_all(bind=engine)
    print(f"[DB] 数据库表已初始化: {database_url[:30]}...")
