import sqlite3
conn = sqlite3.connect('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db')
cursor = conn.cursor()

print('=== C004 最新月份数据 ===')
cursor.execute('''
    SELECT period_date, dimension_json, value 
    FROM indicator_points 
    WHERE series_key = ? 
    ORDER BY period_date DESC 
    LIMIT 8
''', ('charging_pile_stock',))
for row in cursor.fetchall():
    dim = row[1]
    pile_type = '未知'
    if '公共桩' in dim:
        pile_type = '公共桩'
    elif '私人桩' in dim:
        pile_type = '私人桩'
    elif '换电站' in dim:
        pile_type = '换电站'
    elif '合计' in dim:
        pile_type = '合计'
    print(f"  {row[0]} | {pile_type}: {row[2]}")

cursor.execute('SELECT COUNT(*) FROM indicator_points WHERE series_key = ?', ('charging_pile_stock',))
print(f"\nTotal C004: {cursor.fetchone()[0]}")
conn.close()
