# 出海综合服务平台 - 部署文档

## 🚀 快速开始（测试环境）

### 前置要求
- Docker >= 20.10
- Docker Compose >= 2.0

### 一键部署

```bash
# 1. 进入项目目录
cd chuhai-platform

# 2. 执行部署脚本
bash deploy.sh
```

部署完成后访问：
- **前端页面**: http://localhost
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

### 手动部署

```bash
# 构建并启动
docker-compose up --build -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

## 📁 项目结构

```
chuhai-platform/
├── backend/              # FastAPI 后端
│   ├── app/              # 应用代码
│   │   ├── api/          # API 路由
│   │   ├── core/         # 配置/数据库
│   │   ├── models/       # SQLAlchemy 模型
│   │   ├── schemas/      # Pydantic Schema
│   │   └── services/     # 业务逻辑
│   ├── scripts/          # 工具脚本
│   │   ├── extract_ontology.py      # 本体抽取
│   │   ├── data_quality_sprint.py   # 数据质量
│   │   └── deduplicate_articles.py  # 去重
│   ├── chuhai_dev.db     # SQLite 开发数据库
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── lib/          # API 客户端
│   │   └── components/   # UI 组件
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── deploy.sh             # 一键部署脚本
```

## 🔧 环境配置

### 后端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DATABASE_URL | 数据库连接 | sqlite:///./data/chuhai.db |
| DEBUG | 调试模式 | false |
| CORS_ORIGINS | 跨域白名单 | ["http://localhost"] |
| REDIS_ENABLED | 是否启用 Redis | false |
| SECRET_KEY | JWT 密钥 | change-me |

### 前端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| VITE_API_URL | 后端 API 地址 | /api/v1 |

## 📊 数据状态

当前数据库包含：
- **174 篇唯一文章**（去重后）
- **86 个实体**（27 企业 + 41 目的国 + 18 产品）
- **19 条关系**
- **64 个活跃信源**
- **13 国评分数据**
- **18 条贸易壁垒**
- **10 家企业追踪**

## 🛠️ 常用操作

### 数据质量脚本

```bash
# 本体抽取
python3 backend/scripts/extract_ontology.py

# 数据质量冲刺
python3 backend/scripts/data_quality_sprint.py

# 文章去重
python3 backend/scripts/deduplicate_articles.py
```

### 数据库操作

```bash
# 查看数据库
sqlite3 backend/chuhai_dev.db '.tables'

# 导出数据
sqlite3 backend/chuhai_dev.db '.dump' > backup.sql
```

## 📦 生产环境

生产环境建议使用：
- **PostgreSQL** 替代 SQLite（取消 docker-compose.yml 中 db 服务的注释）
- **Redis** 缓存（取消 docker-compose.yml 中 redis 服务的注释）
- **Nginx** 反向代理（已包含在 frontend 服务中）
- **HTTPS** 证书

## 📝 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2026-08-23 | 测试环境部署就绪 |
