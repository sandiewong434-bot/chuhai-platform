#!/usr/bin/env python3
"""C012-C014 海外投资真实数据入库

数据源: GF提供材料/fdi投资数据.xlsx (fDi Markets 口径, 2013-2025, 8977 条中国对
外直接投资项目明细, 含目标国家/投资企业/行业/金额)。

NEV 产业链口径: 重点行业 ∈ {汽车OEM, 汽车零部件, 电池, 储能电池} (913 个项目)。
  说明: fDi 将电池制造归入"电子元器件"、储能电池归入"可再生能源"行业大类,
  因此使用材料方标注的"重点行业"列作为 NEV 过滤口径。

输出序列:
  - invest_destination_top10 / overseas_investment_top10 (C012): 目的国 TOP10, 累计金额
  - invest_enterprise_top10 (C013): 投资企业 TOP10, 累计金额
  - invest_total_growth (C014): 产业链海外投资年度总额及同比

用法: cd backend && python3 scripts/seed_fdi_investment.py [excel路径]
"""
import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

DB = Path(__file__).resolve().parent.parent / "chuhai_dev.db"
EXCEL_DEFAULT = "/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/GF提供材料/GF提供材料/fdi投资数据.xlsx"
SOURCE = "fDi Markets 2013-2025 (GF提供材料/fdi投资数据.xlsx)"
SNAPSHOT = "2025-12-01"  # 数据覆盖至2025年
NEV_FOCUS = ["汽车OEM", "汽车零部件", "电池", "储能电池"]

# fDi 英文企业名 → 中文常用名（仅影响展示，映射按聚合后 TOP 企业维护）
COMPANY_ZH = {
    "Contemporary Amperex Technology (CATL)": "宁德时代",
    "Zhejiang Geely Holding Group (Geely Holding Group)": "吉利控股",
    "Gotion": "国轩高科",
    "BYD": "比亚迪",
    "Envision AESC": "远景动力",
    "Eve Energy": "亿纬锂能",
    "China Energy Engineering": "中国能建",
    "Sunwoda Electronic": "欣旺达",
    "Svolt Energy": "蜂巢能源",
    "Volvo Automotive (Volvo Cars)": "沃尔沃汽车",
    "Beijing Automotive Industry Holding (BAIC) (BAIC Group)": "北汽集团",
    "SAIC Motor": "上汽集团",
    "Great Wall Motor": "长城汽车",
    "Chery Automobile": "奇瑞汽车",
    "Changan Automobile": "长安汽车",
    "Ningbo Tuopu Group (Tuopu Group)": "拓普集团",
    "Minth Group": "敏实集团",
    "Hangzhou Weichi (Tianjin) Automotive Parts": "潍柴动力",
    "Wanxiang Group": "万向集团",
    "Xiamen Tungsten (XTC)": "厦门钨业",
    "Huayou Cobalt": "华友钴业",
    "Ganfeng Lithium": "赣锋锂业",
    "Tianqi Lithium": "天齐锂业",
    "CNGR Advanced Material": "中伟股份",
    "BTR New Material Group": "贝特瑞",
    "Putailai (Shanghai Putailai)": "璞泰来",
    "Shanghai Dunamis Power Technology (Dunamis)": "多氟多",
}


def zh(name: str) -> str:
    return COMPANY_ZH.get(name, name)


def main() -> None:
    excel = sys.argv[1] if len(sys.argv) > 1 else EXCEL_DEFAULT
    df = pd.read_excel(excel, sheet_name="总表")
    df["Project date"] = pd.to_numeric(df["Project date"], errors="coerce")
    df = df[df["Source  country"].astype(str).str.contains("China", na=False)]
    nev = df[df["重点行业"].isin(NEV_FOCUS)].copy()
    nev = nev[nev["投资-亿美元"].notna()]
    print(f"NEV产业链项目: {len(nev)} 条, 金额合计 {nev['投资-亿美元'].sum():.1f} 亿美元")

    con = sqlite3.connect(DB)
    cur = con.cursor()
    now = datetime.now().isoformat(timespec="seconds")
    keys = ["invest_destination_top10", "overseas_investment_top10",
            "invest_enterprise_top10", "invest_total_growth"]
    for k in keys:
        cur.execute("DELETE FROM indicator_points WHERE series_key=?", (k,))
    print(f"已清除 {sum(cur.rowcount if cur.rowcount>0 else 0 for _ in [0]) if False else ''}旧mock数据".strip() or "已清除旧mock数据")

    def insert(key: str, period: str, ptype: str, value: float,
               dims: dict, yoy: float | None = None) -> None:
        dims = {**dims, "source": SOURCE, "unit": "亿美元",
                "scope": "NEV产业链(汽车OEM/零部件/电池/储能电池)",
                "period": "2013-2025累计" if ptype == "snapshot" else str(period)[:4]}
        cur.execute(
            "INSERT INTO indicator_points (series_key, period_date, period_type, value,"
            " value_yoy, dimension_json, source_raw, confidence, created_at)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (key, period, "yearly" if ptype == "yearly" else ptype, round(float(value), 2),
             yoy, json.dumps(dims, ensure_ascii=False), SOURCE, 0.9, now),
        )

    # ── C012 目的国 TOP10 ──
    country = (nev.groupby("目标国家")["投资-亿美元"].agg(total="sum", projects="count")
               .sort_values("total", ascending=False).head(10))
    for rank, (c, row) in enumerate(country.iterrows(), 1):
        top_cos = (nev[nev["目标国家"] == c].groupby("Investing company")["投资-亿美元"]
                   .sum().sort_values(ascending=False).head(2))
        note = "/".join(f"{zh(co)}({v:.1f}亿)" for co, v in top_cos.items())
        for key in ("invest_destination_top10", "overseas_investment_top10"):
            insert(key, SNAPSHOT, "snapshot", row["total"],
                   {"country": c, "rank": rank, "projects": int(row["projects"]), "note": note})

    # ── C013 投资企业 TOP10 ──
    ent = (nev.groupby("Investing company")["投资-亿美元"].agg(total="sum", projects="count")
           .sort_values("total", ascending=False).head(10))
    for rank, (e, row) in enumerate(ent.iterrows(), 1):
        dest = (nev[nev["Investing company"] == e].groupby("目标国家")["投资-亿美元"]
                .sum().sort_values(ascending=False).head(1))
        note = f"主要目的地: {dest.index[0]}({dest.iloc[0]:.1f}亿)" if len(dest) else ""
        insert("invest_enterprise_top10", SNAPSHOT, "snapshot", row["total"],
               {"enterprise": zh(e), "enterprise_en": e, "rank": rank, "projects": int(row["projects"]), "note": note})

    # ── C014 年度总额及同比 ──
    yearly = nev.groupby("Project date")["投资-亿美元"].sum().sort_index()
    prev = None
    for year, total in yearly.items():
        yoy = round((total / prev - 1) * 100, 1) if prev else None
        insert("invest_total_growth", f"{int(year)}-12-01", "yearly", total,
               {"metric": "投资总额", "projects": int((nev['Project date'] == year).sum())}, yoy=yoy)
        prev = total

    con.commit()
    for k in keys:
        n = cur.execute("SELECT COUNT(*) FROM indicator_points WHERE series_key=?", (k,)).fetchone()[0]
        print(f"  {k}: {n} 条")
    con.close()
    print("完成 ✅")


if __name__ == "__main__":
    main()
