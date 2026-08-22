# -*- coding: utf-8 -*-
"""
通用配置驱动爬虫
支持 HTML / JSON 两种解析模式，GET / POST 两种请求方式
通过 sources_catalog.json 配置驱动，零代码新增信源
"""

import json
import sys
import time
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import Article
from crawlers.utils import safe_request, parse_chinese_date, generate_id


# 出海相关关键词（用于过滤）
RELEVANT_KEYWORDS = [
    "海外", "境外", "出国", "出口", "出海", "外贸", "国际化", "全球化",
    "投资", "建厂", "工厂", "基地", "产业园", "园区",
    "合资", "合作", "协议", "签约", "并购", "收购",
    "反倾销", "反补贴", "关税", "贸易", "壁垒", "救济",
    "销量", "销售", "市场", "订单", "出口量", "装车",
    "RCEP", "东盟", "欧盟", "一带一路", "东南亚", "中东", "拉美",
    "储能", "光伏", "锂电", "动力电池", "新能源汽车", "NEV", "电动车",
    "匈牙利", "泰国", "印尼", "西班牙", "墨西哥", "巴西", "土耳其",
]


def load_source_config(config_path: str | None = None) -> list[dict]:
    """加载信源配置"""
    if config_path is None:
        config_path = Path(__file__).parent / "sources_catalog.json"
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("sources", [])


def is_relevant_title(title: str) -> bool:
    """判断标题是否与出海相关"""
    if not title:
        return False
    title_lower = title.lower()
    return any(kw in title_lower for kw in RELEVANT_KEYWORDS)


def fetch_list_page(source: dict, page: int = 1) -> str | dict:
    """获取列表页内容"""
    list_url = source.get("list_url", "")
    if not list_url:
        return ""
    
    parse_mode = source.get("parse_mode", "html")
    api_method = source.get("api_method", "get")
    api_params = source.get("api_params", {})
    
    # 分页参数处理
    params = dict(api_params)
    page_key = None
    for key in ["page", "pageNo", "current", "pageNum"]:
        if key in params:
            page_key = key
            break
    if page_key:
        params[page_key] = page
    
    headers = source.get("headers", {})
    
    try:
        if api_method.lower() == "post":
            resp = safe_request(list_url, method="POST", headers=headers, json_data=params)
        else:
            if params and parse_mode == "json":
                resp = safe_request(list_url, method="POST", headers=headers, json_data=params)
            else:
                # HTML模式，URL中拼接分页参数（简单处理）
                url = list_url
                if page > 1:
                    # 尝试常见的分页模式
                    if "page=" in url or "pageNo=" in url:
                        url = url.replace("page=1", f"page={page}").replace("pageNo=1", f"pageNo={page}")
                    else:
                        separator = "&" if "?" in url else "?"
                        url = f"{url}{separator}page={page}"
                resp = safe_request(url, method="GET", headers=headers)
        
        if parse_mode == "json":
            return resp.json()
        return resp.text
        
    except Exception as e:
        print(f"[WARN] 获取列表页失败 {source.get('name')}: {e}")
        return "" if parse_mode != "json" else {}


def extract_items_html(html: str, selectors: dict, base_url: str) -> list[dict]:
    """从HTML中提取列表项"""
    soup = BeautifulSoup(html, "html.parser")
    items = []
    
    list_selector = selectors.get("list_item", "")
    title_sel = selectors.get("title", "")
    link_sel = selectors.get("link", "")
    date_sel = selectors.get("date", "")
    
    if not list_selector:
        return items
    
    elements = soup.select(list_selector)
    
    for elem in elements:
        try:
            # 提取标题
            title_elem = elem.select_one(title_sel) if title_sel else None
            title = title_elem.get_text(strip=True) if title_elem else ""
            if not title and title_sel:
                # 尝试直接从elem中获取
                title = elem.get_text(strip=True)[:200]
            
            # 提取链接
            link_elem = elem.select_one(link_sel) if link_sel else None
            link = ""
            if link_elem:
                link = link_elem.get("href", "")
                if not link:
                    link = link_elem.get_text(strip=True)
            # 处理相对链接
            if link and not link.startswith(("http://", "https://")):
                link = urljoin(base_url, link)
            
            # 提取日期
            date_elem = elem.select_one(date_sel) if date_sel else None
            date_str = date_elem.get_text(strip=True) if date_elem else ""
            
            if title and link:
                items.append({
                    "title": title,
                    "url": link,
                    "date_str": date_str,
                })
        except Exception as e:
            continue
    
    return items


def extract_items_json(data: dict, selectors: dict, url_template: str | None = None) -> list[dict]:
    """从JSON响应中提取列表项"""
    items = []
    
    list_path = selectors.get("list_item", "")
    title_key = selectors.get("title", "")
    link_key = selectors.get("link", "")
    date_key = selectors.get("date", "")
    
    # 解析嵌套路径，如 "obj.rows" 或 "results.data.results"
    rows = data
    if list_path:
        for key in list_path.split("."):
            if isinstance(rows, dict):
                rows = rows.get(key, [])
            elif isinstance(rows, list):
                break
    
    if not isinstance(rows, list):
        return items
    
    for row in rows:
        try:
            if isinstance(row, dict):
                title = str(row.get(title_key, "")).strip()
                link_val = row.get(link_key, "")
                date_str = str(row.get(date_key, "")).strip()
                
                # 处理链接
                link = ""
                if isinstance(link_val, str):
                    link = link_val
                elif isinstance(link_val, (int, float)):
                    link = str(link_val)
                
                # 应用URL模板
                if url_template and link:
                    if "{id}" in url_template:
                        link = url_template.replace("{id}", str(link))
                    elif "{ID}" in url_template:
                        link = url_template.replace("{ID}", str(link))
                
                if title and link:
                    # 确保链接是完整URL
                    if not link.startswith(("http://", "https://")):
                        # 尝试从list_url推导base
                        pass
                    items.append({
                        "title": title,
                        "url": link,
                        "date_str": date_str,
                    })
            elif isinstance(row, list):
                # 某些API返回的是数组，如 [id, title, ...]
                if len(row) > max(
                    int(link_key) if link_key.isdigit() else 0,
                    int(title_key) if title_key.isdigit() else 0,
                    int(date_key) if date_key.isdigit() else 0,
                ):
                    title = str(row[int(title_key)]).strip() if title_key.isdigit() else ""
                    link = str(row[int(link_key)]).strip() if link_key.isdigit() else ""
                    date_str = str(row[int(date_key)]).strip() if date_key.isdigit() else ""
                    if title:
                        items.append({"title": title, "url": link, "date_str": date_str})
        except Exception as e:
            continue
    
    return items


def crawl_source(source: dict, db: Session, max_pages: int = 3, days_back: int = 7) -> dict:
    """
    抓取单个信源
    
    Returns:
        {"new_inserted": int, "total_fetched": int, "errors": int}
    """
    source_id = source.get("id", 0)
    source_name = source.get("name", "未知信源")
    parse_mode = source.get("parse_mode", "html")
    selectors = source.get("selectors", {})
    url_template = source.get("url_template")
    list_url = source.get("list_url", "")
    category_layer = source.get("category_layer")
    category_tag = source.get("category_tag")
    
    print(f"[CRAWL] 开始抓取: {source_name} (mode={parse_mode})")
    
    new_inserted = 0
    total_fetched = 0
    errors = 0
    
    cutoff_date = datetime.now() - timedelta(days=days_back)
    
    for page in range(1, max_pages + 1):
        try:
            # 获取列表页
            raw_data = fetch_list_page(source, page)
            if not raw_data:
                break
            
            # 提取列表项
            if parse_mode == "json":
                items = extract_items_json(raw_data, selectors, url_template)
            else:
                items = extract_items_html(raw_data, selectors, list_url)
            
            if not items:
                print(f"[INFO] {source_name} 第{page}页无数据，结束")
                break
            
            print(f"[INFO] {source_name} 第{page}页提取 {len(items)} 条")
            
            for item in items:
                total_fetched += 1
                title = item["title"]
                url = item["url"]
                date_str = item.get("date_str", "")
                
                # 关键词过滤（可选，关闭以抓取全量）
                # if not is_relevant_title(title):
                #     continue
                
                # 生成唯一键
                unique_key = generate_id(str(source_id), source_name, title, url)
                
                # 检查是否已存在
                existing = db.query(Article).filter(Article.unique_key == unique_key).first()
                if existing:
                    continue
                
                # 解析日期
                publish_date = parse_chinese_date(date_str) if date_str else None
                
                # 如果日期太久远，跳过
                if publish_date and publish_date.date() < cutoff_date.date():
                    continue
                article = Article(
                    source_id=source_id,
                    source_name=source_name,
                    title=title,
                    url=url,
                    publish_date=publish_date,
                    unique_key=unique_key,
                    category_layer=category_layer,
                    category_tag=category_tag,
                    content=None,  # 详情页内容后续抓取
                )
                db.add(article)
                new_inserted += 1
            
            db.commit()
            time.sleep(1)  # 礼貌间隔
            
        except Exception as e:
            errors += 1
            print(f"[ERROR] {source_name} 第{page}页异常: {e}")
            try:
                db.rollback()
            except:
                pass
            continue
    
    print(f"[DONE] {source_name}: 新入库 {new_inserted}, 总获取 {total_fetched}, 错误 {errors}")
    return {
        "new_inserted": new_inserted,
        "total_fetched": total_fetched,
        "errors": errors,
    }


def crawl_source_by_id(source_id: int, db: Session | None = None, max_pages: int = 3, days_back: int = 7) -> dict:
    """通过ID抓取指定信源"""
    sources = load_source_config()
    source = next((s for s in sources if s.get("id") == source_id), None)
    if not source:
        return {"error": f"信源ID {source_id} 不存在"}
    
    close_db = db is None
    if db is None:
        db = SessionLocal()
    
    try:
        return crawl_source(source, db, max_pages, days_back)
    finally:
        if close_db:
            db.close()


def crawl_all_active(db: Session | None = None, max_pages: int = 2, days_back: int = 7) -> dict:
    """抓取所有激活的auto_html信源"""
    sources = load_source_config()
    
    # 筛选可自动抓取的信源
    active_sources = [
        s for s in sources
        if s.get("crawl_tier") in ("auto_html",)
        and not s.get("network_issue", False)
        and s.get("selectors", {}).get("list_item")
        and s.get("list_url")
    ]
    
    print(f"[SCHEDULER] 共 {len(active_sources)} 个信源待抓取")
    
    close_db = db is None
    if db is None:
        db = SessionLocal()
    
    results = {}
    try:
        for source in active_sources:
            try:
                stats = crawl_source(source, db, max_pages, days_back)
                results[source["name"]] = stats
                time.sleep(3)  # 信源间间隔
            except Exception as e:
                print(f"[ERROR] 信源 {source.get('name')} 抓取失败: {e}")
                try:
                    db.rollback()
                except:
                    pass
                results[source["name"]] = {"error": str(e)}
                continue
    finally:
        if close_db:
            db.close()
    
    return results


def import_sources_to_db(db: Session | None = None) -> int:
    """将信源配置导入数据库 sources 表"""
    from app.models import SourceConfig
    
    sources = load_source_config()
    close_db = db is None
    if db is None:
        db = SessionLocal()
    
    count = 0
    try:
        for s in sources:
            existing = db.query(SourceConfig).filter(SourceConfig.source_id == s["id"]).first()
            if existing:
                continue
            
            config = SourceConfig(
                source_id=s["id"],
                name=s["name"],
                org_type=s.get("org_type"),
                column_name=s.get("column"),
                list_url=s.get("list_url"),
                content_format=s.get("content_format"),
                access_method=s.get("access_method"),
                unique_id_rule=s.get("unique_id_rule"),
                access_restriction=s.get("access_restriction"),
                update_freq=s.get("update_freq"),
                target_db=s.get("target_db"),
                nev_relevance=s.get("nev_relevance"),
                authority=s.get("authority"),
                compliance=s.get("compliance"),
                crawl_tier=s.get("crawl_tier"),
                library=s.get("library"),
                category_layer=s.get("category_layer"),
                category_tag=s.get("category_tag"),
                network_issue=s.get("network_issue", False),
                selectors=s.get("selectors"),
                is_active=s.get("crawl_tier") == "auto_html" and not s.get("network_issue", False),
            )
            db.add(config)
            count += 1
        
        db.commit()
        print(f"[IMPORT] 已导入 {count} 个信源配置到数据库")
        return count
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    # 测试：导入信源配置
    import_sources_to_db()
    
    # 测试：抓取所有激活信源（第1页，最近3天）
    print("\n" + "="*60)
    print("开始批量抓取测试...")
    print("="*60)
    results = crawl_all_active(max_pages=1, days_back=3)
    
    print("\n" + "="*60)
    print("抓取结果汇总:")
    print("="*60)
    total_new = sum(r.get("new_inserted", 0) for r in results.values() if isinstance(r, dict))
    total_fetch = sum(r.get("total_fetched", 0) for r in results.values() if isinstance(r, dict))
    print(f"总新入库: {total_new}")
    print(f"总获取: {total_fetch}")
    for name, stats in results.items():
        if isinstance(stats, dict) and "error" not in stats:
            print(f"  {name}: +{stats.get('new_inserted', 0)}")
