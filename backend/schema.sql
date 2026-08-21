-- ============================================================
-- 出海综合服务平台 · PostgreSQL Schema (v1.0)
-- 基于现有 SQLite articles.db 结构升级
-- ============================================================

-- 扩展：支持中文全文检索
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------
-- 1. 文章主表 (articles)
-- 从 SQLite 迁移，新增 content 字段（从 articles.content 或 article_content 合并）
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER NOT NULL,
    source_name     VARCHAR(200) NOT NULL,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    publish_date    DATE,
    unique_key      TEXT NOT NULL,
    crawled_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    relevance       VARCHAR(20) CHECK (relevance IN ('direct', 'industry', 'unrelated')),
    category_layer  VARCHAR(20) CHECK (category_layer IN ('enterprise', 'industry', 'nation', 'none')),
    category_tag    VARCHAR(500),
    content         TEXT,                       -- 正文内容（从 article_content 合并）
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_unique_key ON articles(unique_key);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_publish_date ON articles(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_layer ON articles(category_layer);
CREATE INDEX IF NOT EXISTS idx_articles_relevance ON articles(relevance);
CREATE INDEX IF NOT EXISTS idx_articles_crawled_at ON articles(crawled_at DESC);

-- 全文检索索引（标题 + 正文）
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles
    USING gin(to_tsvector('chinese', coalesce(title,'') || ' ' || coalesce(content,'')));

-- ---------------------------------------------------------
-- 2. 本体对象表 (objects)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS objects (
    id              SERIAL PRIMARY KEY,
    obj_id          VARCHAR(50) NOT NULL UNIQUE,     -- 如 OBJ-01-001
    obj_type        VARCHAR(50) NOT NULL,             -- 企业 / 目的国 / 产品
    name            VARCHAR(200) NOT NULL,
    attributes_json JSONB,                           -- 扩展属性
    source_libraries VARCHAR(200),                   -- 依据库字母串
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_objects_type ON objects(obj_type);
CREATE INDEX IF NOT EXISTS idx_objects_name ON objects USING gin(name gin_trgm_ops);

-- ---------------------------------------------------------
-- 3. 关系表 (relations)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS relations (
    id              SERIAL PRIMARY KEY,
    rel_id          VARCHAR(50) NOT NULL UNIQUE,     -- 如 REL-01-001
    rel_type        VARCHAR(50) NOT NULL,             -- 出海投资建厂 / 出海经营 / 贸易壁垒
    from_obj        VARCHAR(200) NOT NULL,            -- 发起方名称
    to_obj          VARCHAR(200) NOT NULL,            -- 目标方名称
    attributes_json JSONB,                           -- 详细属性（时间/金额/方式/状态/税率/依据句等）
    source_article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    confidence      VARCHAR(20) CHECK (confidence IN ('高', '中', '低')),
    category        VARCHAR(50),                      -- NEV核心 / 其他
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_relations_type ON relations(rel_type);
CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_obj);
CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_obj);
CREATE INDEX IF NOT EXISTS idx_relations_article ON relations(source_article_id);

-- ---------------------------------------------------------
-- 4. 文章标签关联表 (article_tags)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_tags (
    id              SERIAL PRIMARY KEY,
    article_id      INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_code        VARCHAR(50) NOT NULL,             -- 如 G2.L2.01
    tag_name        VARCHAR(200),
    confidence      VARCHAR(20) CHECK (confidence IN ('auto', 'manual', 'reviewed')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, tag_code)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_code ON article_tags(tag_code);

-- ---------------------------------------------------------
-- 5. 信源日志表 (source_logs)
-- 记录每次爬虫运行的结果
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS source_logs (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER NOT NULL,
    source_name     VARCHAR(200) NOT NULL,
    run_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial', 'skipped')),
    new_count       INTEGER DEFAULT 0,
    total_fetched   INTEGER DEFAULT 0,
    error_message   TEXT,
    duration_sec    INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_logs_source ON source_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_source_logs_run_at ON source_logs(run_at DESC);

-- ---------------------------------------------------------
-- 6. 国别评分表 (country_scores)
-- 引擎三评分结果存储
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS country_scores (
    id              SERIAL PRIMARY KEY,
    country_code    VARCHAR(10) NOT NULL,             -- ISO 3166-1 alpha-3
    country_name    VARCHAR(100) NOT NULL,
    industry        VARCHAR(50) NOT NULL,             -- NEV / 动力电池 / 储能 / 光伏 / 整车
    score_total     NUMERIC(5,2) NOT NULL,            -- 总分 0-100
    score_level     VARCHAR(20) NOT NULL,             -- 强烈推荐 / 推荐 / 谨慎推荐 / 不推荐 / 暂不推荐
    dimension_scores JSONB,                          -- {d1: 85, d2: 90, ...}
    subitem_scores  JSONB,                           -- 36子项详细得分
    scored_at       DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code, industry, scored_at)
);

CREATE INDEX IF NOT EXISTS idx_country_scores_country ON country_scores(country_code);
CREATE INDEX IF NOT EXISTS idx_country_scores_scored_at ON country_scores(scored_at DESC);

-- ---------------------------------------------------------
-- 7. 标签字典表 (tag_dictionary)
-- G1-G12 标签体系定义
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tag_dictionary (
    id              SERIAL PRIMARY KEY,
    tag_code        VARCHAR(50) NOT NULL UNIQUE,     -- G{组}.L{级}.{序号}
    group_code      VARCHAR(10) NOT NULL,             -- G1, G2, ...
    group_name      VARCHAR(100) NOT NULL,
    level           INTEGER NOT NULL,                 -- 层级深度 1/2/3
    parent_code     VARCHAR(50),                      -- 父级标签码
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    used_for        VARCHAR(200),                     -- 主要使用库
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tag_dict_group ON tag_dictionary(group_code);
CREATE INDEX IF NOT EXISTS idx_tag_dict_parent ON tag_dictionary(parent_code);

-- ---------------------------------------------------------
-- 8. 信源配置表 (sources)
-- 从 sources.json 导入，便于数据库内管理
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
    id              SERIAL PRIMARY KEY,
    source_id       INTEGER NOT NULL UNIQUE,          -- 与 sources.json 中的 id 对应
    name            VARCHAR(200) NOT NULL,
    org_type        VARCHAR(100),
    column_name     VARCHAR(200),
    list_url        TEXT,
    content_format  VARCHAR(50),
    access_method   VARCHAR(50),
    unique_id_rule  TEXT,
    access_restriction TEXT,
    update_freq     VARCHAR(50),
    target_db       VARCHAR(200),
    nev_relevance   VARCHAR(50),
    authority       VARCHAR(50),
    compliance      TEXT,
    crawl_tier      VARCHAR(50),
    library         VARCHAR(50),
    category_layer  VARCHAR(20),
    category_tag    VARCHAR(200),
    network_issue   BOOLEAN DEFAULT FALSE,
    selectors       JSONB,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_library ON sources(library);

-- ---------------------------------------------------------
-- 初始化标签字典数据（G1-G12 核心标签）
-- ---------------------------------------------------------
INSERT INTO tag_dictionary (tag_code, group_code, group_name, level, name, description, used_for) VALUES
('G1', 'G1', '信源属性', 1, '信源属性', '这条信息从哪来、可信度如何', '资料库'),
('G2', 'G2', '国别与区域', 1, '国别与区域', '涉及哪个/哪些国家', '两库共用'),
('G3', 'G3', '产业链环节', 1, '产业链环节', '涉及NEV链条哪一环', '两库共用'),
('G4', 'G4', '出海形式', 1, '出海形式', '以什么方式出海', '两库共用'),
('G5', 'G5', '指标映射', 1, '指标映射', '支撑哪个评估指标', '两库共用'),
('G6', 'G6', '风险标签', 1, '风险标签', '涉及什么风险、什么级别', '资料库'),
('G7', 'G7', '时效标签', 1, '时效标签', '数据多新、多久更新', '两库共用'),
('G8', 'G8', '企业主体', 1, '企业主体', '哪家企业、什么角色', '企业信息库'),
('G9', 'G9', '信息主题', 1, '信息主题', '这条内容讲的是哪类事', '资料库'),
('G10', 'G10', '政策工具', 1, '政策工具', '政策用了什么手段', '资料库')
ON CONFLICT (tag_code) DO NOTHING;
