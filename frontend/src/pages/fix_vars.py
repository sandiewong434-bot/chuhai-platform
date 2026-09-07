with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'r') as f:
    content = f.read()

# Fix 1: Remove duplicate exportBrandData/exportBrandLoading declarations (lines 184-185)
old_dup = '''  const [penetrationData, setPenetrationData] = useState<{country: string; ownership: number; penetration: number; region: string}[]>([])
  const [penetrationLoading, setPenetrationLoading] = useState(false)
  const [exportBrandData, setExportBrandData] = useState<{rank: number; brand: string; volume: number; note: string}[]>([])
  const [exportBrandLoading, setExportBrandLoading] = useState(false)
  useEffect(() => {'''

new_dup = '''  const [penetrationData, setPenetrationData] = useState<{country: string; ownership: number; penetration: number; region: string}[]>([])
  const [penetrationLoading, setPenetrationLoading] = useState(false)
  useEffect(() => {'''

if old_dup in content:
    content = content.replace(old_dup, new_dup)
    print("Fix 1: Removed duplicate exportBrand declarations")
else:
    print("Fix 1: Pattern not found")

# Fix 2: Add missing salesRankLoading declaration
old_sales = '''  }, [activeTab])
  const [salesRankData, setSalesRankData] = useState<{rank: number; name: string; sales: number; share: number}[]>([])

  // ── 下游 C004 API 数据（充电桩保有量）──'''

new_sales = '''  }, [activeTab])
  const [salesRankData, setSalesRankData] = useState<{rank: number; name: string; sales: number; share: number}[]>([])
  const [salesRankLoading, setSalesRankLoading] = useState(false)

  // ── 下游 C004 API 数据（充电桩保有量）──'''

if old_sales in content:
    content = content.replace(old_sales, new_sales)
    print("Fix 2: Added missing salesRankLoading declaration")
else:
    print("Fix 2: Pattern not found")

with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'w') as f:
    f.write(content)

print("Done!")
