"""导入 0907 技术合作抽取结果到 indicator_points，替换 C015-C017 mock 数据"""
import sqlite3
import json
import pandas as pd

DB = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db'

df = pd.read_excel('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/0907技术合作抽取结果.xlsx')
print(f'读取 {len(df)} 条技术合作记录')

conn = sqlite3.connect(DB, timeout=30)
c = conn.cursor()

# 1. 清除旧的 mock 数据（三个 tech_coop 系列）
for sk in ['tech_coop_projects', 'tech_coop_region_dist', 'tech_license_count']:
    c.execute("DELETE FROM indicator_points WHERE series_key=?", (sk,))
    print(f'清除 {sk} 旧数据')

# 2. 更新 series 表的 last_sync_at
from datetime import datetime
now = datetime.now().isoformat()

# ═══ C015 tech_coop_projects：逐条项目入库 ═══
inserted = 0
skipped = 0
for _, row in df.iterrows():
    cn = str(row['中方企业']).strip() if pd.notna(row['中方企业']) else ''
    foreign = str(row['外方企业']).strip() if pd.notna(row['外方企业']) else ''
    if not cn or not foreign:
        skipped += 1
        continue

    sign_time = str(row['签约时间']).strip() if pd.notna(row['签约时间']) else ''
    # 标准化日期
    period_date = '2026-01-01'
    if sign_time and sign_time not in ('nan', '', 'None'):
        try:
            period_date = pd.to_datetime(sign_time).strftime('%Y-%m-%d')
        except Exception:
            period_date = sign_time[:7] + '-01' if len(sign_time) >= 7 else '2026-01-01'

    conf_map = {'高': 'high', '中': 'medium', '已确认': 'high', '待核实': 'low'}
    confidence = conf_map.get(str(row['confidence']).strip(), 'medium')

    dim = {
        'enterprise_cn': cn,
        'enterprise_foreign': foreign,
        'country': str(row['外方国别']).strip() if pd.notna(row['外方国别']) else '',
        'coop_type': str(row['合作模式']).strip() if pd.notna(row['合作模式']) else '其他',
        'domain': str(row['合作领域']).strip() if pd.notna(row['合作领域']) else '',
        'summary': str(row['事实简述']).strip() if pd.notna(row['事实简述']) else '',
        'source': str(row['信源名称']).strip() if pd.notna(row['信源名称']) else '',
        'url': str(row['source_url']).strip() if pd.notna(row['source_url']) else '',
        'confidence_label': str(row['confidence']).strip(),
    }

    c.execute(
        "INSERT INTO indicator_points (series_key, period_date, period_type, value, dimension_json, source_raw, confidence, created_at) VALUES (?,?,?,?,?,?,?,?)",
        ('tech_coop_projects', period_date, 'month', 1, json.dumps(dim, ensure_ascii=False),
         str(row['evidence(原文句)']) if pd.notna(row['evidence(原文句)']) else '', confidence, now)
    )
    inserted += 1

print(f'C015 tech_coop_projects: 入库 {inserted} 条, 跳过 {skipped} 条')

# ═══ C016 tech_coop_region_dist：按区域聚合 ═══
region_map = {
    '德国': '欧洲', '法国': '欧洲', '英国': '欧洲', '荷兰': '欧洲', '西班牙': '欧洲',
    '意大利': '欧洲', '瑞典': '欧洲', '挪威': '欧洲', '波兰': '欧洲', '匈牙利': '欧洲',
    '土耳其': '欧洲', '捷克': '欧洲', '奥地利': '欧洲', '比利时': '欧洲', '丹麦': '欧洲',
    '美国': '北美', '加拿大': '北美', '墨西哥': '北美',
    '日本': '东亚', '韩国': '东亚',
    '泰国': '东南亚', '马来西亚': '东南亚', '印度尼西亚': '东南亚', '越南': '东南亚', '新加坡': '东南亚', '菲律宾': '东南亚',
    '印度': '南亚', '巴基斯坦': '南亚',
    '沙特阿拉伯': '中东', '阿联酋': '中东', '以色列': '中东', '伊朗': '中东', '卡塔尔': '中东',
    '巴西': '南美', '阿根廷': '南美', '智利': '南美', '哥伦比亚': '南美',
    '澳大利亚': '大洋洲', '新西兰': '大洋洲',
    '埃及': '非洲', '南非': '非洲', '摩洛哥': '非洲',
}

region_counts = {}
for _, row in df.iterrows():
    country = str(row['外方国别']).strip() if pd.notna(row['外方国别']) else '其他'
    region = region_map.get(country, '其他')
    region_counts[region] = region_counts.get(region, 0) + 1

for region, count in sorted(region_counts.items(), key=lambda x: -x[1]):
    c.execute(
        "INSERT INTO indicator_points (series_key, period_date, period_type, value, dimension_json, source_raw, confidence, created_at) VALUES (?,?,?,?,?,?,?,?)",
        ('tech_coop_region_dist', '2026-09-01', 'quarter', count, json.dumps({'region': region, 'unit': '项目数'}, ensure_ascii=False), '', 'high', now)
    )
print(f'C016 tech_coop_region_dist: 入库 {len(region_counts)} 个区域')

# ═══ C017 tech_license_count：按月聚合签约数 ═══
month_counts = {}
for _, row in df.iterrows():
    sign_time = str(row['签约时间']).strip() if pd.notna(row['签约时间']) else ''
    if not sign_time or sign_time in ('nan', '', 'None'):
        continue
    try:
        month = pd.to_datetime(sign_time).strftime('%Y-%m')
    except Exception:
        continue
    month_counts[month] = month_counts.get(month, 0) + 1

for month, count in sorted(month_counts.items()):
    c.execute(
        "INSERT INTO indicator_points (series_key, period_date, period_type, value, dimension_json, source_raw, confidence, created_at) VALUES (?,?,?,?,?,?,?,?)",
        ('tech_license_count', month + '-01', 'month', count, json.dumps({'metric': '技术合作协议数', 'unit': '项'}, ensure_ascii=False), '', 'high', now)
    )
print(f'C017 tech_license_count: 入库 {len(month_counts)} 个月份')

# 3. 更新 series 元数据
for sk in ['tech_coop_projects', 'tech_coop_region_dist', 'tech_license_count']:
    c.execute("UPDATE indicator_series SET last_sync_at=?, is_active=1 WHERE series_key=?", (now, sk))

conn.commit()

# 验证
for sk in ['tech_coop_projects', 'tech_coop_region_dist', 'tech_license_count']:
    c.execute("SELECT COUNT(*) FROM indicator_points WHERE series_key=?", (sk,))
    print(f'  验证 {sk}: {c.fetchone()[0]} 条')

conn.close()
print('导入完成！')
