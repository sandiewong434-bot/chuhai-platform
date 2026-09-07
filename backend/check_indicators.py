import sqlite3
conn = sqlite3.connect('chuhai_dev.db', timeout=20)
c = conn.cursor()

# Check sample data for C011-C019 related series
series_to_check = [
    'vehicle_export_total_rank',
    'vehicle_export_global_rank', 
    'invest_destination_top10',
    'overseas_investment_top10',
    'invest_enterprise_top10',
    'invest_total_growth',
    'tech_coop_projects',
    'tech_coop_region_dist',
    'tech_license_count',
    'global_sales_china_share',
    'penetration_vs_ownership'
]

for sk in series_to_check:
    c.execute("SELECT period_date, value, dimension_json, period_type FROM indicator_points WHERE series_key=? ORDER BY period_date DESC LIMIT 2", (sk,))
    rows = c.fetchall()
    print(f"\n=== {sk} ===")
    if rows:
        for r in rows:
            print(f"  date={r[0]}, value={r[1]}, dim={r[2]}, type={r[3]}")
    else:
        print("  No data")

conn.close()
