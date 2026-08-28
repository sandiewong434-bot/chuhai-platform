# 爬虫定时调度配置

## Crontab 配置（推荐）

编辑当前用户的 crontab：

```bash
crontab -e
```

添加以下内容：

```cron
# 出海平台 - 爬虫定时任务
# 每日凌晨 2:00 运行增量更新
0 2 * * * cd /opt/chuhai-platform && bash scripts/crawl_cron.sh daily >> logs/cron.log 2>&1

# 每周日凌晨 3:00 运行全量更新+数据质量检查
0 3 * * 0 cd /opt/chuhai-platform && bash scripts/crawl_cron.sh weekly >> logs/cron_weekly.log 2>&1

# 每日上午 10:00 补全正文（处理新入库文章）
0 10 * * * cd /opt/chuhai-platform && bash scripts/crawl_cron.sh content >> logs/cron_content.log 2>&1
```

## Systemd Timer 配置（可选）

创建 `/etc/systemd/system/chuhai-crawl-daily.service`：

```ini
[Unit]
Description=出海平台 - 每日爬虫增量更新
After=network.target

[Service]
Type=oneshot
User=chuhai
WorkingDirectory=/opt/chuhai-platform
ExecStart=/bin/bash /opt/chuhai-platform/scripts/crawl_cron.sh daily
```

创建 `/etc/systemd/system/chuhai-crawl-daily.timer`：

```ini
[Unit]
Description=出海平台 - 每日爬虫定时器

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now chuhai-crawl-daily.timer
```

## 手动运行

```bash
# 每日增量
bash scripts/crawl_cron.sh daily

# 每周全量
bash scripts/crawl_cron.sh weekly

# 仅补全正文
bash scripts/crawl_cron.sh content
```

## 日志位置

- 任务日志：`logs/crawl_daily_YYYYMMDD_HHMMSS.log`
- Cron汇总：`logs/cron.log`
- 自动清理：7天前的日志自动删除
