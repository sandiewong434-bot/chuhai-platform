with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'r') as f:
    lines = f.readlines()

# Find and remove duplicate lines around 352-356
# We want to keep only one copy of the state declarations
new_lines = []
i = 0
while i < len(lines):
    # Check for the pattern: "  }, [activeTab])" followed by duplicate state declarations
    if i + 3 < len(lines) and lines[i].strip() == '}, [activeTab])':
        # Look ahead to see if next lines are duplicate state declarations
        next_lines = [lines[i+1].strip(), lines[i+2].strip() if i+2 < len(lines) else '']
        if 'const [salesRankData' in next_lines[0]:
            # Add the }, [activeTab])
            new_lines.append(lines[i])
            # Add the salesRankData line
            new_lines.append(lines[i+1])
            # Skip any subsequent duplicate lines
            i += 2
            # Skip extra }, [activeTab]) and duplicate declarations
            while i < len(lines) and (lines[i].strip() == '}, [activeTag])' or 'const [salesRankData' in lines[i] or 'const [salesRankLoading' in lines[i]):
                i += 1
            continue
    new_lines.append(lines[i])
    i += 1

with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'w') as f:
    f.writelines(new_lines)

print("Fixed duplicate lines")
