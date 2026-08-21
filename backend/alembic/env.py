# -*- coding: utf-8 -*-
"""Alembic 环境配置"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# 导入应用配置和模型
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.database import Base
from app.models import Article, ObjectEntity, Relation, SourceLog, CountryScore, SourceConfig

settings = get_settings()
config = context.config

# 配置日志
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 元数据目标（用于 autogenerate）
target_metadata = Base.metadata

# 从环境变量覆盖数据库 URL
def get_url():
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """离线模式运行迁移（生成 SQL 脚本）"""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """在线模式运行迁移（直接操作数据库）"""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,        # 检测列类型变化
            compare_server_default=True,  # 检测默认值变化
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
