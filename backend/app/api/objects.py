# -*- coding: utf-8 -*-
"""本体与关系 API"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import ObjectEntity, Relation
from app.schemas import ObjectEntityResponse, OntologyFilter, RelationResponse

router = APIRouter(prefix="/ontology", tags=["本体"])

# 关系类型中文映射
REL_TYPE_MAP = {
    "rel-01-overseas_invest": "海外投资",
    "rel-02-overseas_biz": "海外经营",
    "rel-03-trade_barrier": "贸易壁垒",
    "rel-04-risk_impact": "风险影响",
}


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
    """获取某对象的关系图谱数据（供前端力导向图渲染）

    注意：relations 表中的 from_obj / to_obj 存的是 obj_id，
    需要先从名称查找 obj_id，查询后再映射回名称。
    """
    # 1. 根据名称查找中心对象的 obj_id
    center_obj = db.query(ObjectEntity).filter(ObjectEntity.name == obj_name).first()
    if not center_obj:
        # 尝试按 obj_id 查找（前端可能直接传 obj_id）
        center_obj = db.query(ObjectEntity).filter(ObjectEntity.obj_id == obj_name).first()
        if not center_obj:
            return {"center": obj_name, "nodes": [], "edges": []}

    center_id = center_obj.obj_id

    # 2. 查询与中心对象直接关联的关系（通过 obj_id）
    relations = (
        db.query(Relation)
        .filter(
            (Relation.from_obj == center_id) | (Relation.to_obj == center_id)
        )
        .limit(50)  # 限制返回数量，避免前端过载
        .all()
    )

    # 3. 收集所有涉及的 obj_id（中心 + 相关节点）
    all_obj_ids = set()
    all_obj_ids.add(center_id)
    for r in relations:
        all_obj_ids.add(r.from_obj)
        all_obj_ids.add(r.to_obj)

    # 4. 批量查询所有 obj_id 对应的名称和类型
    obj_map = {}
    objects = db.query(ObjectEntity).filter(ObjectEntity.obj_id.in_(list(all_obj_ids))).all()
    for o in objects:
        obj_map[o.obj_id] = {"name": o.name, "type": o.obj_type}

    # 5. 构建节点列表（用名称作为 id，兼容前端）
    nodes = set()
    nodes.add(obj_map.get(center_id, {}).get("name", center_id))

    edges = []
    for r in relations:
        src_name = obj_map.get(r.from_obj, {}).get("name", r.from_obj)
        tgt_name = obj_map.get(r.to_obj, {}).get("name", r.to_obj)

        # 过滤掉孤儿节点（名称以 OBJ- 开头的说明映射失败）
        if src_name.startswith("OBJ-") or tgt_name.startswith("OBJ-"):
            continue

        nodes.add(src_name)
        nodes.add(tgt_name)

        # 关系类型映射为中文显示
        rel_type_display = REL_TYPE_MAP.get(r.rel_type, r.rel_type)

        edges.append({
            "source": src_name,
            "target": tgt_name,
            "type": rel_type_display,
            "confidence": r.confidence,
            "raw_type": r.rel_type,
        })

    # 查询所有节点（包括名称）的类型信息
    node_names = list(nodes)
    node_type_map = {}
    node_objs = db.query(ObjectEntity).filter(ObjectEntity.name.in_(node_names)).all()
    for o in node_objs:
        node_type_map[o.name] = o.obj_type

    return {
        "center": obj_map.get(center_id, {}).get("name", center_id),
        "center_type": obj_map.get(center_id, {}).get("type", "unknown"),
        "nodes": [
            {"id": n, "type": node_type_map.get(n, "unknown")} for n in nodes
        ],
        "edges": edges,
    }
