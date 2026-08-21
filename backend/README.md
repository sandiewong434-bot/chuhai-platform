# 出海综合服务平台 · FastAPI 后端

## 技术栈

- **FastAPI** — 高性能异步 Web 框架
- **SQLAlchemy 2.0** — ORM，支持 PostgreSQL
- **Pydantic v2** — 数据校验与配置管理
- **Alembic** — 数据库迁移
- **PostgreSQL** — 主数据库（含中文全文检索）
- **Redis** — 缓存与任务队列
- **Docker & Docker Compose** — 容器化部署

## 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口
│   ├── core/
│   │   ├── config.py        # Pydantic Settings
│   │   └── database.py      # SQLAlchemy 引擎 & Session
│   ├── models/
│   │   └── __init__.py      # 6 个核心模型
│   ├── schemas/
│   │   └── __init__.py      # Pydantic Schema
│   └── api/
│       ├── __init__.py      # 路由聚合
│       ├── articles.py      # 文章列表/详情/统计
│       ├── objects.py       # 本体对象/关系/图谱
│       ├── search.py        # 全文搜索
│       ├── sources.py       # 信源健康度/日志
│       └── score.py         # 国别评分（引擎三）
├── alembic/                 # 数据库迁移
│   ├── env.py
│   └── versions/
├── schema.sql               # PostgreSQL Schema（初始化）
├── migrate.py               # SQLite → PG 迁移脚本
├── requirements.txt
├── Dockerfile
└── alembic.ini
```

## 快速启动

### 1. 使用 Docker Compose（推荐）

```bash
# 复制环境变量
cp .env.example .env

# 启动全部服务（PostgreSQL + Redis + Backend）
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止
docker-compose down
```

服务地址：
- API: http://localhost:8000
- Swagger 文档: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 2. 本地开发

```bash
# 1. 创建虚拟环境
python -m venv .venv
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 设置 DATABASE_URL 等

# 4. 初始化数据库（手动执行 schema.sql 或 alembic）
psql -d chuhai -f schema.sql
# 或
alembic upgrade head

# 5. 启动开发服务器（带热重载）
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 数据库迁移

```bash
# 生成迁移脚本（修改模型后执行）
alembic revision --autogenerate -m "描述变更"

# 执行迁移
alembic upgrade head

# 回滚一次
alembic downgrade -1
```

## API 概览

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/v1/articles` | GET | 文章列表（搜索+筛选+分页） |
| `/api/v1/articles/{id}` | GET | 文章详情 |
| `/api/v1/articles/recent/days` | GET | 近期文章统计 |
| `/api/v1/ontology/objects` | GET | 本体对象列表 |
| `/api/v1/ontology/relations` | GET | 关系列表 |
| `/api/v1/ontology/graph/{name}` | GET | 对象关系图谱 |
| `/api/v1/search` | GET | 全文搜索 |
| `/api/v1/sources` | GET | 信源健康度 |
| `/api/v1/sources/stats/overview` | GET | 信源统计概览 |
| `/api/v1/score/country` | POST | 国别评分计算 |
| `/api/v1/score/history/{code}` | GET | 评分历史 |
| `/health` | GET | 服务健康检查 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `postgresql://chuhai:chuhai@localhost:5432/chuhai` | 数据库连接串 |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis 连接串 |
| `SECRET_KEY` | `change-me-in-production` | JWT/加密密钥 |
| `DEBUG` | `false` | 调试模式 |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 跨域白名单 |

## 从 SQLite 迁移到 PostgreSQL

```bash
# 确保 SQLite 文件在当前目录
python backend/migrate.py
```

该脚本会：
1. 读取 `articles.db` 和 `sources.json`
2. 迁移到 PostgreSQL
3. 自动回填正文内容

## 开发计划

- [x] FastAPI 框架搭建
- [x] PostgreSQL Schema 设计
- [x] 6 大核心 API 模块
- [x] Docker Compose 部署
- [ ] JWT 认证与用户管理
- [ ] Redis 缓存接入
- [ ] 引擎三国别评分完整实现
- [ ] 爬虫调度与增量更新
- [ ] 前端 React 项目对接
