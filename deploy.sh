#!/bin/bash
# 出海综合服务平台 - 测试环境一键部署脚本

set -e

echo "========================================"
echo "  出海综合服务平台 - 测试环境部署"
echo "========================================"

# 检查 Docker
echo ""
echo "[1/5] 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo "  ❌ Docker 未安装，请先安装 Docker"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "  ❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi
echo "  ✅ Docker 环境正常"

# 检查数据库文件
echo ""
echo "[2/5] 检查数据库文件..."
if [ ! -f "backend/chuhai_dev.db" ]; then
    echo "  ⚠️ 数据库文件 backend/chuhai_dev.db 不存在"
    echo "     请确保已运行数据初始化脚本"
fi
echo "  ✅ 数据库文件就绪"

# 构建镜像
echo ""
echo "[3/5] 构建 Docker 镜像..."
docker-compose build
echo "  ✅ 镜像构建完成"

# 启动服务
echo ""
echo "[4/5] 启动服务..."
docker-compose up -d
echo "  ✅ 服务已启动"

# 检查服务状态
echo ""
echo "[5/5] 检查服务状态..."
sleep 3

# 检查后端
if curl -s http://localhost:8000/health > /dev/null; then
    echo "  ✅ 后端 API: http://localhost:8000"
    echo "     健康检查: $(curl -s http://localhost:8000/health)"
else
    echo "  ⚠️ 后端 API 可能未就绪，请检查日志: docker-compose logs backend"
fi

# 检查前端
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|304"; then
    echo "  ✅ 前端页面: http://localhost"
else
    echo "  ⚠️ 前端页面可能未就绪，请检查日志: docker-compose logs frontend"
fi

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  📊 仪表盘: http://localhost"
echo "  🔧 API 文档: http://localhost:8000/docs"
echo "  🔍 API: http://localhost:8000/api/v1"
echo ""
echo "  常用命令:"
echo "    查看日志: docker-compose logs -f"
echo "    停止服务: docker-compose down"
echo "    重启服务: docker-compose restart"
echo ""
