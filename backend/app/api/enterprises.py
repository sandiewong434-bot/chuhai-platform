# -*- coding: utf-8 -*-
"""企业追踪相关 API

从已标注文章中提取企业出海动态
"""

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Article, Relation

router = APIRouter(prefix="/enterprises", tags=["企业追踪"])


# 重点追踪的NEV企业
TRACKED_ENTERPRISES = [
    {"id": "byd", "name": "比亚迪", "keywords": ["比亚迪", "BYD"]},
    {"id": "catl", "name": "宁德时代", "keywords": ["宁德时代", "CATL", "时代新能源"]},
    {"id": "nio", "name": "蔚来", "keywords": ["蔚来", "NIO"]},
    {"id": "xpeng", "name": "小鹏", "keywords": ["小鹏", "Xpeng", "XPEV"]},
    {"id": "li", "name": "理想", "keywords": ["理想", "Li Auto", "理想汽车"]},
    {"id": "geely", "name": "吉利", "keywords": ["吉利", "极氪", "Zeekr", "领克"]},
    {"id": "saic", "name": "上汽", "keywords": ["上汽", "MG", "名爵"]},
    {"id": "chery", "name": "奇瑞", "keywords": ["奇瑞", "Chery"]},
    {"id": "gwm", "name": "长城", "keywords": ["长城", "欧拉", "坦克", "WEY"]},
    {"id": "seres", "name": "赛力斯", "keywords": ["赛力斯", "SERES", "问界"]},
]


def identify_enterprise(title: str, content: str = "") -> dict | None:
    """识别文章涉及的企业"""
    text = title + content
    for ent in TRACKED_ENTERPRISES:
        for kw in ent["keywords"]:
            if kw in text:
                return ent
    return None


def identify_event_type(title: str) -> str:
    """识别事件类型"""
    if "建厂" in title or "投资" in title and "工厂" in title:
        return "投资建厂"
    if "出口" in title or "销量" in title:
        return "出口/销量"
    if "合作" in title or "合资" in title:
        return "战略合作"
    if "签约" in title or "协议" in title:
        return "签约/协议"
    if "发布" in title:
        return "产品发布"
    if "本地化" in title or "本土化" in title:
        return "本地化"
    return "出海动态"


def extract_location(title: str, content: str = "") -> str:
    """提取地点"""
    text = title + content
    locations = [
        "泰国", "印尼", "印度尼西亚", "越南", "马来西亚", "菲律宾", "新加坡",
        "匈牙利", "德国", "西班牙", "法国", "意大利", "波兰", "土耳其",
        "墨西哥", "巴西", "阿根廷", "智利", "哥伦比亚",
        "阿联酋", "沙特", "埃及", "南非",
        "印度", "日本", "韩国", "澳大利亚",
    ]
    for loc in locations:
        if loc in text:
            return loc
    return "海外"


@router.get("")
def list_enterprise_events(
    enterprise: str | None = None,
    event_type: str | None = None,
    country: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取企业出海动态事件列表"""
    query = db.query(Article)

    # 企业筛选
    if enterprise:
        ent_config = next((e for e in TRACKED_ENTERPRISES if e["id"] == enterprise or e["name"] == enterprise), None)
        if ent_config:
            ent_conditions = []
            for kw in ent_config["keywords"]:
                ent_conditions.append(Article.title.ilike(f"%{kw}%"))
                ent_conditions.append(Article.content.ilike(f"%{kw}%"))
            query = query.filter(or_(*ent_conditions))
        else:
            query = query.filter(
                or_(
                    Article.title.ilike(f"%{enterprise}%"),
                    Article.content.ilike(f"%{enterprise}%"),
                )
            )
    else:
        # 未指定企业时，匹配所有重点企业
        all_keywords = []
        for ent in TRACKED_ENTERPRISES:
            all_keywords.extend(ent["keywords"])
        kw_conditions = []
        for kw in all_keywords:
            kw_conditions.append(Article.title.ilike(f"%{kw}%"))
        query = query.filter(or_(*kw_conditions))

    # 出海相关关键词
    sea_keywords = ["海外", "境外", "出口", "出海", "建厂", "投资"]
    sea_conditions = []
    for kw in sea_keywords:
        sea_conditions.append(Article.title.ilike(f"%{kw}%"))
        sea_conditions.append(Article.content.ilike(f"%{kw}%"))
    query = query.filter(or_(*sea_conditions))

    # 国家筛选
    if country:
        query = query.filter(
            or_(
                Article.title.ilike(f"%{country}%"),
                Article.content.ilike(f"%{country}%"),
            )
        )

    total = query.count()

    items = (
        query.order_by(desc(Article.publish_date), desc(Article.crawled_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # 转换为事件格式
    results = []
    for article in items:
        title = article.title or ""
        content = article.content or ""

        ent = identify_enterprise(title, content)
        if not ent:
            continue

        et = identify_event_type(title)
        if event_type and et != event_type:
            continue

        results.append({
            "id": article.id,
            "enterprise_id": ent["id"],
            "enterprise_name": ent["name"],
            "title": title,
            "event_type": et,
            "location": extract_location(title, content),
            "date": str(article.publish_date) if article.publish_date else None,
            "description": content[:300] if content else title,
            "source_name": article.source_name,
            "url": article.url,
        })

    return {
        "total": len(results),
        "items": results,
        "page": page,
        "size": size,
    }


@router.get("/timeline/{enterprise_id}")
def get_enterprise_timeline(
    enterprise_id: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取单个企业的出海时间线"""
    ent_config = next((e for e in TRACKED_ENTERPRISES if e["id"] == enterprise_id), None)
    if not ent_config:
        return {"error": "未知企业", "enterprise_id": enterprise_id}

    # 查询文章
    ent_conditions = []
    for kw in ent_config["keywords"]:
        ent_conditions.append(Article.title.ilike(f"%{kw}%"))
        ent_conditions.append(Article.content.ilike(f"%{kw}%"))

    sea_keywords = ["海外", "境外", "出口", "出海", "建厂"]
    sea_conditions = []
    for kw in sea_keywords:
        sea_conditions.append(Article.title.ilike(f"%{kw}%"))

    articles = (
        db.query(Article)
        .filter(or_(*ent_conditions))
        .filter(or_(*sea_conditions))
        .order_by(desc(Article.publish_date))
        .limit(limit)
        .all()
    )

    events = []
    for article in articles:
        title = article.title or ""
        content = article.content or ""
        events.append({
            "date": str(article.publish_date) if article.publish_date else None,
            "type": identify_event_type(title),
            "location": extract_location(title, content),
            "detail": title,
            "source": article.source_name,
            "url": article.url,
        })

    return {
        "enterprise_id": enterprise_id,
        "enterprise_name": ent_config["name"],
        "event_count": len(events),
        "events": events,
    }


@router.get("/list")
def list_enterprises():
    """获取支持追踪的企业列表"""
    return {
        "total": len(TRACKED_ENTERPRISES),
        "items": TRACKED_ENTERPRISES,
    }
