import sys
import os

# 强制使用统一的 SQLite 绝对路径
DB_PATH = '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/chuhai_test.db'
os.environ['DATABASE_URL'] = f'sqlite:///{DB_PATH}'

sys.path.insert(0, '/Users/jiaxinwong/Documents/Kimi/Workspaces/出海/chuhai-platform/backend')

from datetime import datetime, date
from app.core.database import engine, Base, SessionLocal
from app.models import Article, SourceConfig

# 1. 创建表
Base.metadata.create_all(bind=engine)
print('Tables created')

# 2. 插入测试数据
db = SessionLocal()

articles = [
    Article(source_id=1, source_name='巨潮资讯网', title='比亚迪宣布在泰国投资38亿元建设整车工厂', url='https://www.cninfo.com.cn/...', publish_date=date(2024,1,15), unique_key='test-001', relevance='direct', category_layer='enterprise', category_tag='G2.L1.01:东南亚,G8.L1.01:比亚迪,G9.L1.01:投资建厂', content='比亚迪股份有限公司公告，拟在泰国罗勇府投资38亿元建设年产15万辆的整车工厂...'),
    Article(source_id=1, source_name='巨潮资讯网', title='宁德时代匈牙利电池工厂获得环评批准', url='https://www.cninfo.com.cn/...', publish_date=date(2024,3,20), unique_key='test-002', relevance='direct', category_layer='enterprise', category_tag='G2.L1.02:欧洲,G8.L1.02:宁德时代,G9.L1.01:投资建厂', content='宁德时代新能源科技股份有限公司公告，匈牙利德布勒森电池工厂项目获得当地政府环评批准...'),
    Article(source_id=2, source_name='商务部', title='欧盟对中国电动汽车发起反补贴调查', url='https://www.mofcom.gov.cn/...', publish_date=date(2023,10,4), unique_key='test-003', relevance='direct', category_layer='nation', category_tag='G2.L1.02:欧洲,G6.L1.01:贸易摩擦,G9.L1.04:贸易壁垒', content='欧盟委员会发布公告，宣布对进口自中国的电动汽车发起反补贴调查...'),
    Article(source_id=3, source_name='贸易救济信息网', title='土耳其对华汽车加征40%额外关税', url='https://trade-remedy.mofcom.gov.cn/...', publish_date=date(2024,6,8), unique_key='test-004', relevance='direct', category_layer='nation', category_tag='G2.L1.03:中东/非洲,G6.L1.01:贸易摩擦,G9.L1.04:贸易壁垒', content='土耳其贸易部发布公告，对从中国进口的汽车产品加征40%的额外关税...'),
    Article(source_id=1, source_name='巨潮资讯网', title='蔚来汽车正式进入阿联酋市场', url='https://www.cninfo.com.cn/...', publish_date=date(2024,1,10), unique_key='test-005', relevance='direct', category_layer='enterprise', category_tag='G2.L1.03:中东/非洲,G8.L1.03:蔚来,G9.L1.10:产品发布', content='蔚来汽车宣布与阿联酋当地经销商合作，正式进入阿联酋市场...'),
]

for a in articles:
    db.add(a)

sources = [
    SourceConfig(source_id=1, name='巨潮资讯网', library='A', crawl_tier='P1', is_active=True),
    SourceConfig(source_id=2, name='商务部', library='A', crawl_tier='P0', is_active=True),
    SourceConfig(source_id=3, name='贸易救济信息网', library='H', crawl_tier='P0', is_active=True),
]

for s in sources:
    db.add(s)

db.commit()
print(f'Seeded {len(articles)} articles, {len(sources)} sources')
