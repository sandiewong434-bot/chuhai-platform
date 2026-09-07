with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'r') as f:
    content = f.read()

# The problematic section - replace with clean version
old_section = '''      .finally(() => setPenetrationLoading(false))
  }, [activeTab])
  const [salesRankData, setSalesRankData] = useState<{rank: number; name: string; sales: number; share: number}[]>([])
  }, [activeTab])
  }, [activeTab])
  const [salesRankData, setSalesRankData] = useState<{rank: number; name: string; sales: number; share: number}[]>([])'''

new_section = '''      .finally(() => setPenetrationLoading(false))
  }, [activeTab])
  const [salesRankData, setSalesRankData] = useState<{rank: number; name: string; sales: number; share: number}[]>([])'''

if old_section in content:
    content = content.replace(old_section, new_section)
    with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'w') as f:
        f.write(content)
    print("Fixed!")
else:
    print("Pattern not found")
    # Show the actual content around that area
    idx = content.find('setPenetrationLoading(false))')
    if idx >= 0:
        print("Found at", idx)
        print(repr(content[idx:idx+400]))
