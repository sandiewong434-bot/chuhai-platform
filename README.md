# 出海综合服务平台 (Chuhai Platform)

> 基于信源采集、本体图谱、国别评分的出海综合服务平台，目标 10 月底上线。

## 项目简介

本平台整合 100+ 信源，通过 LLM 语义分类与人工校验，构建 NEV（新能源汽车）出海领域的企业-国家-产品本体图谱，并提供国别评分（引擎三）与贸易壁垒追踪能力。

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React + Vite)                   │
│  ├─ 仪表盘首页                                               │
│  ├─ 文章检索（搜索 + 筛选 + 分页）                           │
│  ├─ 本体图谱（关系网络可视化）                               │
│  ├─ 国别评估（雷达图 + 评分等级）                            │
│  ├─ 贸易壁垒（案件查询 + NEV 高亮）                          │
│  ├─ 企业追踪（出海动态时间线）                               │
│  └─ 信源监控（健康度 + 日志）                                │
├─────────────────────────────────────────────────────────────┤
│                      API 网关 (FastAPI)                      │
│  ├─ /api/v1/articles     文章服务                            │
│  ├─ /api/v1/ontology     本体服务                            │
│  ├─ /api/v1/search       搜索服务                            │
│  ├─ /api/v1/sources      信源服务                            │
│  └─ /api/v1/score        国别评分服务                        │
├─────────────────────────────────────────────────────────────┤
│                    数据层 (PostgreSQL + Redis)               │
│  ├─ 文章主表 / 本体对象 / 关系 / 标签                        │
│  ├─ 信源日志 / 国别评分 / 信源配置                           │
│  └─ 全文检索（PostgreSQL tsvector）                          │
└─────────────────────────────────────────────────────────────┘
```

## 快速启动

### Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/mrak123/chuhai-platform.git
cd chuhai-platform

# 2. 配置环境变量
cp .env.example .env

# 3. 启动全部服务
docker-compose up -d

# 4. 访问服务
# 前端: http://localhost
# API:  http://localhost:8000
# 文档: http://localhost:8000/docs
```

### 本地开发

**后端:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**前端:**
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

## 项目结构

```
chuhai-platform/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py          # 应用入口
│   │   ├── core/            # 配置 & 数据库
│   │   ├── models/          # SQLAlchemy 模型
│   │   ├── schemas/         # Pydantic Schema
│   │   └── api/             # API 路由
│   ├── alembic/             # 数据库迁移
│   ├── schema.sql           # PG Schema
│   ├── migrate.py           # SQLite → PG 迁移
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite 前端
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   └── lib/api.ts       # API 客户端
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── nginx/                   # Nginx 配置
├── docker-compose.yml
└── .env.example
```

## 团队分工

| 角色 | 人数 | 职责 |
|------|------|------|
| 信源收集人员 | 1 | 信源扩充、sources.json 维护、LLM Prompt 设计 |
| 信息采集人员 | 1 | 爬虫开发、正文抓取、增量更新 |
| 全栈工程师 | 1 | 前后端开发、API 设计、部署运维 |
| 标注工程师 | 1 | G1-G12 标签体系映射、人工校验、本体标注 |
| 大模型 | - | 语义分类、标签自动标注、关系抽取辅助 |

## 开发路线图

- **Phase 1 (8月底)**：基础设施 + 75+ 信源 + G1-G12 标签体系
- **Phase 2 (9月底)**：100+ 信源 + 6 大前端页面 + 本体图谱 + 引擎三评分
- **Phase 3 (10月底)**：性能优化 + 数据质量冲刺 + 生产部署

详见 [GitHub Issues](https://github.com/mrak123/chuhai-platform/issues)

## 数据库迁移

```bash
# 生成迁移
cd backend
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head
```

## 许可证

MIT
