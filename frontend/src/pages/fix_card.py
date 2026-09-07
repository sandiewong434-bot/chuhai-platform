with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'r') as f:
    content = f.read()

# Find and fix the duplicate card header
old_section = '''          {/* 整车企业梯队 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">车企销量排名 TOP10（API实时·最新月）</h3>
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">车企销量排名 TOP10（API实时·最新月）</h3>'''

new_section = '''          {/* 整车企业梯队 */}
          <div className="ch-card-cut">
            <div className="ch-card-cut-inner p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="ch-title-bar" />
                <h3 className="text-lg font-semibold text-white">车企销量排名 TOP10（API实时·最新月）</h3>'''

if old_section in content:
    content = content.replace(old_section, new_section)
    with open('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/frontend/src/pages/IndustryChain.tsx', 'w') as f:
        f.write(content)
    print("Fixed duplicate card header!")
else:
    print("Pattern not found")
