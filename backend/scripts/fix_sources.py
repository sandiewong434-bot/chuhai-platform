import sqlite3
conn = sqlite3.connect('/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend/chuhai_dev.db')
c = conn.cursor()
c.execute('UPDATE sources SET network_issue = 1 WHERE name IN (?, ?)', ('欧盟EUR-Lex', '美国USTR'))
conn.commit()
c.execute('SELECT COUNT(*) FROM sources WHERE network_issue = 1')
print('Sources with issues:', c.fetchone()[0])
c.execute('SELECT source_id, name, network_issue FROM sources WHERE name IN (?, ?)', ('欧盟EUR-Lex', '美国USTR'))
for row in c.fetchall():
    print(row)
conn.close()
