path = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/app/core/config.py'
with open(path, 'r') as f:
    content = f.read()

old = '    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]'
new = '    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"]'

if old in content:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print("CORS updated")
else:
    print("CORS pattern not found")
    print(repr(content[content.find('CORS'):content.find('CORS')+100]))
