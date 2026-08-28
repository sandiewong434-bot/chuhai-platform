#!/bin/bash
# 出海平台 - 爬虫定时任务脚本
# 建议配合 crontab 或 systemd timer 使用
#
# 用法:
#   bash scripts/crawl_cron.sh daily    # 每日增量更新
#   bash scripts/crawl_cron.sh weekly   # 每周全量更新
#   bash scripts/crawl_cron.sh content  # 补全缺失正文

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$LOG_DIR/crawl_${1:-daily}_${TIMESTAMP}.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$BACKEND_DIR"

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

log "========================================"
log "爬虫任务开始: ${1:-daily}"
log "========================================"

case "${1:-daily}" in
    daily)
        log "[1/3] 运行专用爬虫（巨潮/港交所）- 日增量..."
        python -m crawlers.scheduler --all --daily >> "$LOG_FILE" 2>&1
        
        log "[2/3] 运行通用爬虫 - 日增量..."
        python -m crawlers.scheduler --generic --daily >> "$LOG_FILE" 2>&1
        
        log "[3/3] 补全新入库文章正文..."
        python -c "
import sys
sys.path.insert(0, '.')
from app.core.database import SessionLocal
from crawlers.generic_crawler import batch_fetch_contents
db = SessionLocal()
stats = batch_fetch_contents(db, limit=50, skip_existing=True)
print(f'正文补全: 成功 {stats[\"success\"]}, 失败 {stats[\"failed\"]}')
db.close()
" >> "$LOG_FILE" 2>&1
        ;;
    
    weekly)
        log "[1/4] 运行专用爬虫 - 周全量（7天）..."
        python -m crawlers.scheduler --all --days 7 >> "$LOG_FILE" 2>&1
        
        log "[2/4] 运行通用爬虫 - 周全量..."
        python -m crawlers.scheduler --generic --days 7 >> "$LOG_FILE" 2>&1
        
        log "[3/4] 补全缺失正文..."
        python -c "
import sys
sys.path.insert(0, '.')
from app.core.database import SessionLocal
from crawlers.generic_crawler import batch_fetch_contents
db = SessionLocal()
stats = batch_fetch_contents(db, limit=200, skip_existing=True)
print(f'正文补全: 成功 {stats[\"success\"]}, 失败 {stats[\"failed\"]}')
db.close()
" >> "$LOG_FILE" 2>&1
        
        log "[4/4] 数据质量检查..."
        python scripts/data_quality_sprint.py >> "$LOG_FILE" 2>&1
        ;;
    
    content)
        log "补全缺失正文..."
        python -c "
import sys
sys.path.insert(0, '.')
from app.core.database import SessionLocal
from crawlers.generic_crawler import batch_fetch_contents
db = SessionLocal()
stats = batch_fetch_contents(db, limit=100, skip_existing=True)
print(f'正文补全: 总计 {stats[\"total\"]}, 成功 {stats[\"success\"]}, 失败 {stats[\"failed\"]}')
db.close()
" >> "$LOG_FILE" 2>&1
        ;;
    
    *)
        echo "用法: $0 {daily|weekly|content}"
        exit 1
        ;;
esac

log "========================================"
log "爬虫任务完成"
log "日志: $LOG_FILE"
log "========================================"

# 清理7天前的日志
find "$LOG_DIR" -name "crawl_*.log" -mtime +7 -delete 2>/dev/null || true
