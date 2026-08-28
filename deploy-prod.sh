#!/bin/bash
# 出海综合服务平台 - 生产环境直接部署脚本
# 适用于已有 Python 3.12 + Nginx 的 Linux 服务器
# 不依赖 Docker

set -e

APP_DIR="/opt/chuhai-platform"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
USER="chuhai"

echo "========================================"
echo "  出海平台 - 生产环境部署"
echo "========================================"

# 检查前置依赖
echo ""
echo "[1/7] 检查前置依赖..."

if ! command -v python3 &> /dev/null; then
    echo "  ❌ Python3 未安装"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo "  ❌ Nginx 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "  ❌ Node.js/npm 未安装"
    exit 1
fi

echo "  ✅ 依赖检查通过"

# 创建用户
echo ""
echo "[2/7] 创建运行用户..."
if ! id "$USER" &>/dev/null; then
    sudo useradd -r -s /bin/false -d "$APP_DIR" "$USER"
    echo "  ✅ 用户 $USER 已创建"
else
    echo "  ✅ 用户 $USER 已存在"
fi

# 创建目录
echo ""
echo "[3/7] 创建应用目录..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"

# 复制代码（假设当前在项目根目录）
echo ""
echo "[4/7] 复制应用代码..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

sudo cp -r "$SCRIPT_DIR/backend" "$APP_DIR/"
sudo cp -r "$SCRIPT_DIR/frontend" "$APP_DIR/"
sudo chown -R "$USER:$USER" "$APP_DIR"

echo "  ✅ 代码已复制到 $APP_DIR"

# 安装后端依赖
echo ""
echo "[5/7] 安装后端依赖..."
sudo -u "$USER" bash -c "cd '$BACKEND_DIR' && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "  ✅ 后端依赖安装完成"

# 构建前端
echo ""
echo "[6/7] 构建前端..."
sudo -u "$USER" bash -c "cd '$FRONTEND_DIR' && npm ci && npm run build"
echo "  ✅ 前端构建完成"

# 配置 Nginx
echo ""
echo "[7/7] 配置 Nginx..."

NGINX_CONF="/etc/nginx/sites-available/chuhai-platform"

sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/chuhai-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }
}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/chuhai-platform
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "  ✅ Nginx 配置完成"

# 创建 systemd 服务
echo ""
echo "[额外] 创建 systemd 服务..."

sudo tee /etc/systemd/system/chuhai-backend.service > /dev/null <<EOF
[Unit]
Description=出海平台后端 API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
Environment="DATABASE_URL=sqlite:///$BACKEND_DIR/data/chuhai.db"
Environment="DEBUG=false"
Environment="CORS_ORIGINS=[\"http://localhost\"]"
Environment="SECRET_KEY=change-me-in-production"
ExecStart=$BACKEND_DIR/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable chuhai-backend

echo "  ✅ systemd 服务已创建"

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  启动服务: sudo systemctl start chuhai-backend"
echo "  查看状态: sudo systemctl status chuhai-backend"
echo "  查看日志: sudo journalctl -u chuhai-backend -f"
echo ""
echo "  访问地址:"
echo "    前端页面: http://<服务器IP>/"
echo "    API 文档: http://<服务器IP>/docs"
echo "    健康检查: http://<服务器IP>/health"
echo ""
echo "  ⚠️  重要提醒:"
echo "    1. 修改 SECRET_KEY 为随机字符串"
echo "    2. 配置防火墙开放 80 端口"
echo "    3. 建议配置 HTTPS（Certbot）"
echo "    4. 建议将 SQLite 迁移到 PostgreSQL"
echo ""
