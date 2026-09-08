"""导入车企出海分国别销量矩阵到 indicator_points
- Sheet07: 中国车企出口年度序列 → vehicle_export_top10_brands (C010)
- Sheet01: 全球分国别总销量2025 → global_sales_china_share (C018)
"""
import sqlite3
import json
import pandas as pd
from datetime import datetime

DB = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db'
XL = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/车企出海_分国别销量矩阵.xlsx'

xl = pd.ExcelFile(XL)
conn = sqlite3.connect(DB, timeout=30)
c = conn.cursor()
now = datetime.now().isoformat()

# ═══ 1. Sheet07 中国车企出口年度序列 → C010 vehicle_export_top10_brands ═══
df7 = xl.parse('07_历史序列与趋势（2023-2025）', header=1)
c.execute("DELETE FROM indicator_points WHERE series_key='vehicle_export_top10_brands'")
print('清除 vehicle_export_top10_brands 旧 mock 数据')

count10 = 0
for _, row in df7.iterrows():
    brand = str(row['车企']).strip()
    if not brand or brand == 'nan' or pd.isna(row['2025']):
        continue
    # 只取有完整3年数据的10家车企行
    if pd.isna(row['2023']) or pd.isna(row['2024']):
        continue

    short_name = brand.split('(')[0].strip()
    for year in [2023, 2024, 2025]:
        val = row[str(year)] if str(year) in row.index else row[year]
        if pd.isna(val):
            continue
        # 处理异常值（如'—'）
        try:
            val_float = float(str(val).replace(',', '').replace('—', '').strip())
        except (ValueError, AttributeError):
            continue
        if val_float <= 0:
            continue
        dim = {
            'brand': short_name,
            'metric': '出口量',
            'note': str(row['信源']) if pd.notna(row['信源']) else '中汽协整车出口TOP10',
        }
        c.execute(
            "INSERT INTO indicator_points (series_key, period_date, period_type, value, dimension_json, source_raw, confidence, created_at) VALUES (?,?,?,?,?,?,?,?)",
            ('vehicle_export_top10_brands', f'{year}-12-01', 'year', val_float,
             json.dumps(dim, ensure_ascii=False), '', 'high', now)
        )
        count10 += 1

print(f'C010 vehicle_export_top10_brands: 入库 {count10} 条 (10车企×3年)')

# ═══ 2. Sheet01 全球分国别总销量2025 → C018 global_sales_china_share ═══
df1 = xl.parse('01_全球分国别总销量', header=3)
c.execute("DELETE FROM indicator_points WHERE series_key='global_sales_china_share'")
print('清除 global_sales_china_share 旧 mock 数据')

count18 = 0
current_region = ''
for _, row in df1.iterrows():
    region = str(row['区域']).strip() if pd.notna(row['区域']) else ''
    if region and region != 'nan':
        current_region = region

    country = str(row['国家/地区']).strip() if pd.notna(row['国家/地区']) else ''
    if not country or country == 'nan':
        continue

    val2025 = row['2025']
    if pd.isna(val2025) or str(val2025).strip() in ('-', ''):
        continue
    # 清除千分位逗号，并转换为万辆（与原 mock 数据单位一致）
    sales = float(str(val2025).replace(',', '')) / 10000

    dim = {
        'country': country,
        'region': current_region,
        'metric': '乘用车总销量',
        'unit': '万辆',
        'source': 'MarkLines Global Automotive Intelligence',
    }
    c.execute(
        "INSERT INTO indicator_points (series_key, period_date, period_type, value, dimension_json, source_raw, confidence, created_at) VALUES (?,?,?,?,?,?,?,?)",
        ('global_sales_china_share', '2025-12-01', 'year', sales,
         json.dumps(dim, ensure_ascii=False), '', 'high', now)
    )
    count18 += 1

print(f'C018 global_sales_china_share: 入库 {count18} 条 (各国2025总销量)')

# 更新 series 元数据
for sk in ['vehicle_export_top10_brands', 'global_sales_china_share']:
    c.execute("UPDATE indicator_series SET last_sync_at=?, is_active=1 WHERE series_key=?", (now, sk))

conn.commit()

# 验证
for sk in ['vehicle_export_top10_brands', 'global_sales_china_share']:
    c.execute("SELECT COUNT(*) FROM indicator_points WHERE series_key=?", (sk,))
    print(f'  验证 {sk}: {c.fetchone()[0]} 条')

# 抽查数据
c.execute("SELECT period_date, value, dimension_json FROM indicator_points WHERE series_key='vehicle_export_top10_brands' AND dimension_json LIKE '%比亚迪%' ORDER BY period_date")
print('\n比亚迪出口序列抽查:')
for r in c.fetchall():
    print(f'  {r[0]}: {r[1]}万辆')

conn.close()
print('导入完成！')
