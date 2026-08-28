# 出海综合服务平台 (Chuhai Platform)

> 基于信源采集、本体图谱、国别评分的出海综合服务平台，目标 10 月底上线。

## 项目简介

本平台整合 **105+ 信源**，覆盖十八大数据库，通过 LLM 语义分类与人工校验，构建 NEV（新能源汽车）出海领域的企业-国家-产品本体图谱，并提供国别评分（引擎三）、贸易壁垒追踪、企业出海动态追踪等能力。

## 当前数据状态

| 指标 | 数值 | 备注 |
|------|------|------|
| 信源总数 | 105 | 覆盖 14 个库 |
| 文章总数 | 173 | 100% 有标注，100% 有日期，93.6% 有正文 |
| 实体数 | 86 | 27 企业 + 41 目的国 + 18 产品 |
| 关系数 | 43 | 企业-国家投资、产品-目标市场等 |
| 国别评分 | 20 | 覆盖 19 个国家/地区 |
| 贸易壁垒 | 18 | 反倾销/反补贴/关税等 |

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React + Vite)                   │
│  ├─ 仪表盘首页（数据概览 + 趋势图 + 信源健康度）            │
│  ├─ 文章检索（全文搜索 + 多维度筛选 + 分页）                │
│  ├─ 文章详情（标签展示 + 原文链接）                         │
│  ├─ 本体图谱（Canvas 力导向图 + 关系网络可视化）            │
│  ├─ 国别评估（雷达图 + 评分等级 + 子项明细）                │
│  ├─ 贸易壁垒（案件查询 + 时间线 + NEV 高亮）                │
│  ├─ 企业追踪（出海动态 + 投资建厂时间线）                   │
│  └─ 信源监控（健康度 + 运行日志）                           │
├─────────────────────────────────────────────────────────────┤
│                      API 网关 (FastAPI)                      │
│  ├─ /api/v1/articles     文章服务（列表/详情/筛选/分页）    │
│  ├─ /api/v1/ontology     本体服务（对象/关系查询）          │
│  ├─ /api/v1/search       搜索服务（全文搜索 + 多维度过滤）  │
│  ├─ /api/v1/sources      信源服务（健康度/状态/手动触发）   │
│  ├─ /api/v1/score        国别评分服务（雷达图/历史趋势）    │
│  ├─ /api/v1/barriers     贸易壁垒服务                       │
│  └─ /api/v1/enterprises  企业追踪服务                       │
├─────────────────────────────────────────────────────────────┤
│                    数据层 (SQLite → PostgreSQL)              │
│  ├─ 文章主表 / 本体对象 / 关系 / 标签                        │
│  ├─ 信源日志 / 国别评分 / 信源配置                           │
│  └─ 全文检索（PostgreSQL tsvector）                          │
└─────────────────────────────────────────────────────────────┘
```

## 快速启动

### Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/sandiewong434-bot/chuhai-platform.git
cd chuhai-platform

# 2. 配置环境变量
cp .env.example .env

# 3. 启动全部服务
bash deploy.sh

# 4. 访问服务
# 前端: http://localhost
# API:  http://localhost:8000
# 文档: http://localhost:8000/docs
```

### 生产环境直接部署（无 Docker）

```bash
# 需要 Python 3.12 + Node.js 20 + Nginx
bash deploy-prod.sh
```

### 本地开发

**后端:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
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
│   │   ├── api/             # API 路由
│   │   └── services/        # 业务逻辑（LLM标注/评分引擎）
│   ├── crawlers/            # 爬虫模块
│   │   ├── generic_crawler.py   # 通用配置驱动爬虫
│   │   ├── juchao.py            # 巨潮资讯爬虫
│   │   ├── hkex.py              # 港交所爬虫
│   │   ├── scheduler.py         # 爬虫调度器
│   │   └── utils.py             # 爬虫工具
│   ├── scripts/             # 数据工具脚本
│   │   ├── bulk_import_sources.py   # 信源批量导入
│   │   ├── data_quality_sprint.py   # 数据质量检查
│   │   ├── fix_dates.py             # 日期补全
│   │   ├── extract_relations.py     # 关系抽取
│   │   └── extract_ontology.py      # 本体抽取
│   ├── chuhai_dev.db        # SQLite 开发数据库
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite 前端
│   ├── src/
│   │   ├── pages/           # 8 个页面组件
│   │   ├── components/      # 公共组件
│   │   └── lib/api.ts       # API 客户端
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── scripts/                 # 运维脚本
│   ├── crawl_cron.sh            # 爬虫定时任务
│   ├── CRAWL_SCHEDULE.md        # 定时调度配置文档
│   └── source_monitor.py        # 信源健康监控
├── nginx/                   # Nginx 配置
├── docker-compose.yml
├── deploy.sh                # Docker 部署脚本
├── deploy-prod.sh           # 生产环境直接部署脚本
├── DEPLOY.md                # 部署文档
├── PLAN_v2.md               # 详细实施计划
└── .env.example
```

## 核心功能

### 已完成 ✅

- **信源采集**：105+ 信源，覆盖十八库，支持 HTML/JSON 两种解析模式
- **LLM 语义分类**：G1-G12 标签体系，100% 文章覆盖
- **本体图谱**：86 个实体，43 条关系，Canvas 力导向图可视化
- **国别评分**：19 个国家/地区，6 维度雷达图
- **贸易壁垒**：18 条案件，NEV 高亮
- **企业追踪**：时间线展示出海动态
- **全文搜索**：多维度筛选 + 分页
- **信源监控**：HTTP 可达性 + 活跃度检查 + Webhook 告警
- **数据质量**：去重、日期补全、关系抽取
- **部署方案**：Docker Compose + 直接部署（systemd + nginx）

### 进行中 🚧

- 正文抓取通用化（93.6% 覆盖，11 篇待补全）
- LLM 语义分类准确率人工校验
- 生产环境压力测试

## 团队分工

| 角色 | 人数 | 职责 |
|------|------|------|
| 信源收集人员 | 1 | 信源扩充、sources.json 维护、信源健康监控 |
| 信息采集人员 | 1 | 爬虫开发、正文抓取、增量更新、定时调度 |
| 全栈工程师 | 1 | 前后端开发、API 设计、部署运维 |
| 标注工程师 | 1 | G1-G12 标签体系映射、人工校验、本体标注 |
| 大模型 | - | 语义分类、标签自动标注、关系抽取辅助 |

## 开发路线图

- **Phase 1 (8月底)** ✅：基础设施 + 75+ 信源 + G1-G12 标签体系 + API 框架
- **Phase 2 (9月底)** 🚧：100+ 信源 ✅ + 6 大前端页面 ✅ + 本体图谱 ✅ + 引擎三评分 ✅
- **Phase 3 (10月底)** 📅：性能优化 ✅ + 数据质量冲刺 ✅ + 生产部署

详见 [GitHub Issues](https://github.com/sandiewong434-bot/chuhai-platform/issues)

## 常用命令

```bash
# 信源批量导入
python3 scripts/bulk_import_sources.py --file new_sources.csv

# 数据质量检查
python3 scripts/data_quality_sprint.py

# 爬虫调度
python3 -m crawlers.scheduler --generic --daily

# 信源健康监控
python3 scripts/source_monitor.py --report

# 日期补全
python3 scripts/fix_dates.py

# 关系抽取
python3 scripts/extract_relations.py
```

## 数据库迁移

```bash
# SQLite → PostgreSQL
cd backend
python migrate.py

# 生成 Alembic 迁移
alembic revision --autogenerate -m "描述"
alembic upgrade head
```

## 许可证

MIT
