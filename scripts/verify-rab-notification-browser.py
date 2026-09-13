from pathlib import Path
import re
# Share the synthetic RAB fixture and API-only interception with the document regression.
exec(Path(__file__).with_name('verify-rab-document-browser.py').read_text(encoding='utf8').split('with sync_playwright() as pw:')[0])
for s in [sipil,me]:s['rab']['status']='Menunggu Persetujuan Manajer'
for row in listed:row['status']='Menunggu Persetujuan Manajer'
item=dict(id='RAB-1',entity_type='RAB',entity_id=1,title='TOKO UJI GABUNGAN',subtitle='Z001-UJI-RAB | SIPIL + ME | HEAD OFFICE',description='Approval RAB berlaku untuk SIPIL dan ME.',action_label='Buka Approval RAB',action_url='/approval?type=RAB&id=1')
group=dict(key='approval_rab',action_type='approval',title='Approval RAB',description='Menunggu approval',count=1,items=[item])
base_route=route
def route(r):
    path=urlparse(r.request.url).path
    if path.endswith('/task-notifications'):
        r.fulfill(json={'status':'success','data':{'total':1,'groups':[group]}});return
    if path.endswith('/rab/2'):
        r.fulfill(json={'status':'success','data':dict(**me,document_scopes=[sipil,me])});return
    base_route(r)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.route('**/*',route)
    context.add_init_script("""for(const [k,v] of Object.entries({authenticated:'true',userRole:'BRANCH BUILDING & MAINTENANCE MANAGER',loggedInUserEmail:'fixture@example.invalid',loggedInUserCabang:'HEAD OFFICE',spartaAccessToken:'synthetic-token','sparta_task_notification_popup_fixture@example.invalid':'1'}))sessionStorage.setItem(k,v);""")
    page=context.new_page()
    page.goto('http://localhost:3000/dashboard',wait_until='domcontentloaded',timeout=90000)
    expect(page.get_by_role('button',name='Buka notifikasi',exact=True)).to_be_visible(timeout=90000)
    page.get_by_role('button',name='Buka notifikasi',exact=True).click()
    page.get_by_text('Approval RAB',exact=True).click()
    expect(page.get_by_text(item['subtitle'],exact=True)).to_be_visible()
    page.get_by_role('button',name=re.compile('TOKO UJI GABUNGAN')).click()
    def check():
        expect(page.get_by_text('Item SIPIL',exact=True)).to_be_visible(timeout=60000)
        expect(page.get_by_text('Item ME',exact=True)).to_be_visible()
        assert page.get_by_text('Item SIPIL',exact=True).count()==1
        assert page.get_by_text('Item ME',exact=True).count()==1
    check()
    page.goto('http://localhost:3000/approval?type=RAB&id=2',wait_until='domcontentloaded')
    check()
    listed.clear()
    page.goto('http://localhost:3000/approval?type=RAB&id=2',wait_until='domcontentloaded')
    check()
    page.screenshot(path=str(out/'approval-notification.png'),full_page=True)
    browser.close()
print('PASS: global notification click, ME legacy link and direct-detail fallback all load both scopes without duplicate items')
