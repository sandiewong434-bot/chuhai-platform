# -*- coding: utf-8 -*-
"""本体与关系 API"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ObjectEntity, Relation
from app.schemas import ObjectEntityResponse, OntologyFilter, RelationResponse

router = APIRouter(prefix="/ontology", tags=["本体"])


@router.get("/objects")
def list_objects(
    obj_type: str | None = None,
    q: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取本体对象列表"""
    query = db.query(ObjectEntity)

    if obj_type:
        query = query.filter(ObjectEntity.obj_type == obj_type)
    if q:
        query = query.filter(ObjectEntity.name.ilike(f"%{q}%"))

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    return {"total": total, "items": items}


@router.get("/objects/{obj_id}", response_model=ObjectEntityResponse)
def get_object(obj_id: str, db: Session = Depends(get_db)):
    """获取单个对象详情"""
    obj = db.query(ObjectEntity).filter(ObjectEntity.obj_id == obj_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="对象不存在")
    return obj


@router.get("/relations")
def list_relations(
    rel_type: str | None = None,
    from_obj: str | None = None,
    to_obj: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """获取关系列表"""
    query = db.query(Relation)

    if rel_type:
        query = query.filter(Relation.rel_type == rel_type)
    if from_obj:
        query = query.filter(Relation.from_obj.ilike(f"%{from_obj}%"))
    if to_obj:
        query = query.filter(Relation.to_obj.ilike(f"%{to_obj}%"))
    if category:
        query = query.filter(Relation.category == category)

    total = query.count()
    items = (
        query.order_by(desc(Relation.created_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return {"total": total, "items": items}


@router.get("/relations/{rel_id}", response_model=RelationResponse)
def get_relation(rel_id: str, db: Session = Depends(get_db)):
    """获取单个关系详情"""
    rel = db.query(Relation).filter(Relation.rel_id == rel_id).first()
    if not rel:
        raise HTTPException(status_code=404, detail="关系不存在")
    return rel


@router.get("/graph/{obj_name}")
def get_object_graph(
    obj_name: str,
    depth: int = Query(1, ge=1, le=3),
    db: Session = Depends(get_db),
):
    """获取某对象的关系图谱数据（供前端力导向图渲染）"""
    # 直接关联的关系
    relations = (
        db.query(Relation)
        .filter(
            (Relation.from_obj == obj_name) | (Relation.to_obj == obj_name)
        )
        .all()
    )

    # 收集所有相关节点
    nodes = set()
    nodes.add(obj_name)
    for r in relations:
        nodes.add(r.from_obj)
        nodes.add(r.to_obj)

    # 查询节点类型
    node_types = {}
    objects = db.query(ObjectEntity).filter(ObjectEntity.name.in_(list(nodes))).all()
    for o in objects:
        node_types[o.name] = o.obj_type

    return {
        "center": obj_name,
        "nodes": [
            {"id": n, "type": node_types.get(n, "unknown")} for n in nodes
        ],
        "edges": [
            {
                "source": r.from_obj,
                "target": r.to_obj,
                "type": r.rel_type,
                "confidence": r.confidence,
            }
            for r in relations
        ],
    }
