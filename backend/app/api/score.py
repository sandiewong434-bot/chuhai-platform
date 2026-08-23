# -*- coding: utf-8 -*-
"""国别评分 API（引擎三）"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import CountryScore
from app.schemas import ScoreRequest, ScoreResponse, ScoreDimension

router = APIRouter(prefix="/score", tags=["国别评分"])


# 评分配置
SCORING_CONFIG = {
    "dimensions": [
        {"code": "d1", "name": "海外布局现状与趋势", "weight": 0.15},
        {"code": "d2", "name": "与中国的双边关系", "weight": 0.20},
        {"code": "d3", "name": "与美国及盟友的关系", "weight": 0.15},
        {"code": "d4", "name": "政治稳定性与政权连续性", "weight": 0.15},
        {"code": "d5", "name": "产业基础与配套能力", "weight": 0.20},
        {"code": "d6", "name": "营商环境与合规要求", "weight": 0.15},
    ],
    "levels": [
        {"min": 90, "max": 100, "label": "强烈推荐"},
        {"min": 75, "max": 89, "label": "推荐"},
        {"min": 60, "max": 74, "label": "谨慎推荐"},
        {"min": 40, "max": 59, "label": "不推荐"},
        {"min": 0, "max": 39, "label": "暂不推荐"},
    ],
}


def calculate_level(score: float) -> str:
    """根据总分计算等级"""
    for level in SCORING_CONFIG["levels"]:
        if level["min"] <= score <= level["max"]:
            return level["label"]
    return "暂不推荐"


@router.post("/country", response_model=ScoreResponse)
def score_country(req: ScoreRequest, db: Session = Depends(get_db)):
    """计算某国某行业的出海评分"""
    # 先查询最新评分
    latest = (
        db.query(CountryScore)
        .filter(
            CountryScore.country_code == req.country_code.upper(),
            CountryScore.industry == req.industry,
        )
        .order_by(desc(CountryScore.scored_at))
        .first()
    )

    if latest:
        return ScoreResponse(
            country_code=latest.country_code,
            country_name=latest.country_name,
            industry=latest.industry,
            score_total=float(latest.score_total),
            score_level=latest.score_level,
            dimensions=ScoreDimension(**(latest.dimension_scores or {})),
            subitems=latest.subitem_scores,
            scored_at=latest.scored_at,
        )

    # 占位演示数据
    demo_scores = {
        "TH": {"name": "泰国", "total": 72, "d": {"d1": 75, "d2": 85, "d3": 55, "d4": 70, "d5": 80, "d6": 65}},
        "ID": {"name": "印度尼西亚", "total": 68, "d": {"d1": 70, "d2": 80, "d3": 50, "d4": 60, "d5": 75, "d6": 70}},
        "HU": {"name": "匈牙利", "total": 78, "d": {"d1": 80, "d2": 65, "d3": 45, "d4": 85, "d5": 85, "d6": 90}},
        "VN": {"name": "越南", "total": 70, "d": {"d1": 78, "d2": 88, "d3": 52, "d4": 65, "d5": 72, "d6": 68}},
        "MX": {"name": "墨西哥", "total": 62, "d": {"d1": 65, "d2": 60, "d3": 35, "d4": 55, "d5": 70, "d6": 75}},
        "BR": {"name": "巴西", "total": 65, "d": {"d1": 68, "d2": 72, "d3": 40, "d4": 60, "d5": 78, "d6": 70}},
        "TR": {"name": "土耳其", "total": 58, "d": {"d1": 60, "d2": 55, "d3": 30, "d4": 50, "d5": 65, "d6": 68}},
        "EG": {"name": "埃及", "total": 55, "d": {"d1": 55, "d2": 70, "d3": 45, "d4": 45, "d5": 50, "d6": 58}},
    }

    demo = demo_scores.get(req.country_code.upper())
    if not demo:
        raise HTTPException(status_code=404, detail=f"暂不支持国家 {req.country_code} 的评分")

    return ScoreResponse(
        country_code=req.country_code.upper(),
        country_name=demo["name"],
        industry=req.industry,
        score_total=demo["total"],
        score_level=calculate_level(demo["total"]),
        dimensions=ScoreDimension(**demo["d"]),
        subitems=None,
        scored_at=date.today(),
    )


@router.get("/countries")
def list_countries(db: Session = Depends(get_db)):
    """获取所有已评分的国家列表"""
    scores = db.query(CountryScore).all()
    countries = {}
    for s in scores:
        countries[s.country_code] = s.country_name
    
    # 补充演示数据中的国家
    demo = {
        "TH": "泰国", "ID": "印度尼西亚", "HU": "匈牙利",
        "VN": "越南", "MX": "墨西哥", "BR": "巴西",
        "TR": "土耳其", "EG": "埃及",
    }
    for code, name in demo.items():
        if code not in countries:
            countries[code] = name

    return {
        "total": len(countries),
        "items": [{"code": k, "name": v} for k, v in countries.items()],
    }


@router.get("/history/{country_code}")
def get_score_history(
    country_code: str,
    industry: str = "NEV",
    db: Session = Depends(get_db),
):
    """获取某国某行业的评分历史"""
    scores = (
        db.query(CountryScore)
        .filter(
            CountryScore.country_code == country_code.upper(),
            CountryScore.industry == industry,
        )
        .order_by(CountryScore.scored_at)
        .all()
    )

    return {
        "country_code": country_code.upper(),
        "industry": industry,
        "count": len(scores),
        "history": [
            {
                "scored_at": str(s.scored_at),
                "score_total": float(s.score_total),
                "score_level": s.score_level,
                "dimensions": s.dimension_scores,
            }
            for s in scores
        ],
    }
