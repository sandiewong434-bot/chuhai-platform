# -*- coding: utf-8 -*-
"""FastAPI 应用入口"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    articles_router,
    barriers_router,
    enterprises_router,
    ontology_router,
    score_router,
    search_router,
    sources_router,
)
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 启动中...")
    yield
    print("👋 应用关闭，清理资源...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="出海综合服务平台后端 API — 信源采集、本体图谱、国别评分、全文搜索",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "服务器内部错误", "error": str(exc)},
    )


# 注册路由
app.include_router(articles_router, prefix="/api/v1")
app.include_router(barriers_router, prefix="/api/v1")
app.include_router(enterprises_router, prefix="/api/v1")
app.include_router(ontology_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(sources_router, prefix="/api/v1")
app.include_router(score_router, prefix="/api/v1")


@app.get("/health", tags=["健康检查"])
def health_check():
    """服务健康检查"""
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/", tags=["根路径"])
def root():
    """API 根路径"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
