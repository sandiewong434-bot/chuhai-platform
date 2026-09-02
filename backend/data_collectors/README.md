# 出海平台 · 自动化数据采集系统

## 概述

覆盖 **19 张 BI 图表** 的数据自动/半自动采集框架，支撑新能源汽车产业链出海智能决策看板。

| 图表ID | 图表名称 | 分类 | 数据来源 | 付费 |
|--------|---------|------|---------|------|
| C001 | 锂盐产能与产量 | 产业链 | SMM/百川盈孚 | ✅ |
| C002 | 锂盐价格走势 | 产业链 | SMM/生意社 | ✅ |
| C003 | 车企销量排名及份额 | 贸易 | 中汽协/乘联会 | |
| C004 | 充电桩保有量及增量 | 基础设施 | 中国充电联盟/IEA | |
| C005 | 新能源销量(全球→中国分车型) | 贸易 | 中汽协/EV-Volumes | |
| C006 | 动力电池产能及利用率 | 产业链 | 高工GGII/SNE | ✅ |
| C007 | 动力电池企业装车量排名及份额 | 产业链 | SNE/动力电池联盟 | |
| C008 | 新能源出口占比提升趋势 | 贸易 | 海关总署/中汽协 | |
| C009 | 新能源出口总量前五地区 | 贸易 | 海关总署 | |
| C010 | 整车出口量TOP10品牌 | 贸易 | 中汽协/海关 | |
| C011 | 整车出口总量及全球排名 | 贸易 | 海关总署/OICA | |
| C012 | 海外投资目的国TOP10 | 投资 | 荣鼎/商务部/fDi | ✅ |
| C013 | 海外投资金额TOP10企业 | 投资 | 荣鼎/企业公告 | ✅ |
| C014 | 产业链海外投资总额及增速 | 投资 | 荣鼎/商务部 | ✅ |
| C015 | 主要中外技术合作项目一览 | 技术 | 企业公告/新闻 | |
| C016 | 技术合作海外区域分布 | 技术 | 人工研编/新闻聚合 | |
| C017 | 技术授权协议数量及增长 | 技术 | 人工研编/行业报告 | |
| C018 | 全球销量TOP15国家及中国品牌市占率 | 贸易 | EV-Volumes/彭博NEF | ✅ |
| C019 | 千人保有量vs渗透率散点图 | 基础设施 | OICA/世界银行/IEA | |

> **付费源**: 未配置 API Key 时自动回退到 `_mock=true` 标记的模拟数据，前端可据此提示"演示数据"。

---

## 快速开始

### 1. 确保依赖安装

```bash
cd backend
pip install httpx beautifulsoup4 sqlalchemy psycopg2-binary
```

### 2. 初始化数据表

```bash
python init_db.py
```

这会创建 `indicator_series` 和 `indicator_points` 等时序数据表。

### 3. 列出所有图表

```bash
python -m data_collectors.run --list
```

### 4. 执行单个图表采集

```bash
python -m data_collectors.run --chart C001
```

### 5. 执行某分类全部图表

```bash
python -m data_collectors.run --category 贸易
```

### 6. 执行全部（含日志记录）

```bash
python -m data_collectors.run --all
```

### 7. 定时调度模式（crontab）

```bash
# 每小时执行一次
python -m data_collectors.run --all --daemon
```

---

## 配置付费 API

在项目根目录 `.env` 或环境变量中配置：

```bash
# SMM 上海有色网
SMM_API_KEY=your_smm_key

# 百川盈孚
BAICHUAN_API_KEY=your_bc_key

# 高工 GGII
GGII_API_KEY=your_ggii_key

# SNE Research
SNE_API_KEY=your_sne_key

# 荣鼎 Rhodium
RHI_API_KEY=your_rhodium_key

# fDi Markets
FDI_API_KEY=your_fdi_key

# EV-Volumes
EVV_API_KEY=your_evv_key

# 彭博 NEF
BNEF_API_KEY=your_bnef_key
```

---

## 架构设计

```
data_collectors/
├── __init__.py           # 包入口
├── base.py               # BaseCollector 基类（通用采集逻辑）
├── registry.py           # 采集器注册表
├── run.py                # 统一调度 CLI
├── utils/                # 公共工具
│   └── __init__.py       # HTTP、HTML解析、企业名归一、国家归一
└── collectors/           # 各图表采集器
    ├── __init__.py       # 自动 import 所有 collectors 完成注册
    ├── supply_chain.py   # C001, C002, C006, C007
    ├── sales_export.py   # C003, C005, C008-C011, C018
    ├── investment.py     # C012-C014
    ├── tech_coop.py      # C015-C017
    └── infrastructure.py # C004, C019
```

---

## 数据采集模式

### 模式一：结构化直入（时序表）
适用：价格、产能、销量、保有量等可直接数值化的指标
- 调用外部 API 或抓取公开数据页面
- 清洗后写入 `indicator_points` 表
- 示例：C001, C002, C004

### 模式二：轻清洗+归一化
适用：排名、份额类数据
- 抓取排名列表 → 企业名归一化 → 写入带 `rank` 维度的指标点
- 示例：C003, C007, C010

### 模式三：事件→关系抽取（★需抽取）
适用：投资建厂、技术合作等事件型数据
- 从平台文章（articles）中抽取 rel-01投资建厂、rel-02出海经营、rel-05跨境投融资 关系
- 关系聚合后生成指标
- 示例：C012-C017

**实现建议**：
```python
# 从关系表聚合投资数据
def aggregate_from_relations(db, rel_type="rel-01"):
    relations = db.query(Relation).filter(Relation.rel_type == rel_type).all()
    # 按国家/企业聚合，生成指标点
    ...
```

---

## 扩展新图表

```python
# data_collectors/collectors/my_new_chart.py
from data_collectors.base import BaseCollector, CollectorResult
from data_collectors.registry import register_collector

@register_collector
class C020_MyNewChart(BaseCollector):
    chart_id = "C020"
    chart_name = "新图表名称"
    source_name = "数据来源"
    category = "产业链"
    freq = "monthly"
    unit = "万吨"

    def collect(self) -> CollectorResult:
        result = CollectorResult()
        series_key = "my_new_series"
        self.ensure_series(series_key)
        # 采集逻辑...
        inserted, updated = self.upsert_indicator_points(series_key, points)
        result.records_inserted = inserted
        result.records_updated = updated
        result.success = True
        return result
```

---

## 与前端对接

采集完成后，前端可通过已有 API 获取指标数据：

```
GET /api/indicators/{series_key}/points?start=2024-01-01&end=2024-12-31
```

（需在后端 `app/api/` 中新增 indicators API，调用 `IndicatorPoint` 模型查询）

---

## 注意事项

1. **付费源回退**：未配置 API Key 时自动生成 `_mock=true` 的数据，不会导致采集失败
2. **频率控制**：建议通过 crontab/systemd timer 调度，而非内置 daemon（ `--daemon` 仅用于测试）
3. **日志**：每次采集自动写入 `data_collection_logs` 表，可在管理后台查看
4. **数据质量**：mock 数据仅供 UI 占位，上线前务必替换为真实数据源
