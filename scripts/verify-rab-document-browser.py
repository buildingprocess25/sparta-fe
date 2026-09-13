import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

out=Path(__file__).resolve().parents[2]/'artifacts'/'rab-document-browser'
out.mkdir(parents=True,exist_ok=True)
def scope(id,lingkup,total,category):
    toko=dict(id=id,nomor_ulok='Z001-UJI-RAB',nama_toko='TOKO UJI GABUNGAN',cabang='HEAD OFFICE',proyek='Reguler',alamat='Alamat uji',lingkup_pekerjaan=lingkup)
    rab=dict(id=id,id_toko=id,status='Disetujui',nama_pt='CV FIXTURE',email_pembuat='fixture@example.invalid',created_at='2026-09-10',grand_total=str(total),grand_total_non_sbo=str(total),grand_total_final=str(total),durasi_pekerjaan='20')
    return dict(toko=toko,rab=rab,items=[dict(id=id,kategori_pekerjaan=category,jenis_pekerjaan='Item '+lingkup,satuan='Ls',volume='1',harga_material=str(total),harga_upah='0',total_harga=total)])
sipil=scope(1,'SIPIL',3785100,'PERSIAPAN')
me=scope(2,'ME',2719500,'PEKERJAAN SBO')
listed=[dict(**s['rab'],toko=s['toko'],lingkup_pekerjaan=s['toko']['lingkup_pekerjaan'],nomor_ulok=s['toko']['nomor_ulok'],cabang='HEAD OFFICE',proyek='Reguler',nama_toko='TOKO UJI GABUNGAN') for s in [sipil,me]]
detail=dict(**sipil,document_scopes=[sipil,me])
requests=[]
def route(r):
    u=urlparse(r.request.url)
    if '/api/' in u.path:
        requests.append(u.path)
        data=[]
        if u.path.endswith('/rab/1'): data=detail
        elif u.path.endswith('/rab'): data=listed
        elif 'system-maintenance' in u.path:data={'is_active':False}
        elif 'system-access-schedule' in u.path:data={'is_enabled':False}
        r.fulfill(json={'status':'success','data':data});return
    if u.hostname not in ['localhost','127.0.0.1']:r.abort();return
    r.continue_()
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.route('**/*',route)
    context.add_init_script("""for(const [k,v] of Object.entries({authenticated:'true',userRole:'BRANCH BUILDING & MAINTENANCE MANAGER',loggedInUserEmail:'fixture@example.invalid',loggedInUserCabang:'HEAD OFFICE',spartaAccessToken:'synthetic-token'}))sessionStorage.setItem(k,v);""")
    page=context.new_page()
    page.goto('http://localhost:3000/list?kategori=RAB',wait_until='domcontentloaded',timeout=90000)
    expect(page.get_by_text('Reguler',exact=True).first).to_be_visible(timeout=90000)
    page.get_by_text('Reguler',exact=True).first.click()
    expect(page.get_by_text('Lainnya',exact=True).first).to_be_visible()
    page.get_by_text('Lainnya',exact=True).first.click()
    expect(page.get_by_text('TOKO UJI GABUNGAN (Sipil & ME)',exact=True)).to_be_visible(timeout=30000)
    page.get_by_text('TOKO UJI GABUNGAN (Sipil & ME)',exact=True).click()
    (out/'detail.html').write_text(page.content(),encoding='utf8')
    expect(page.get_by_role('heading',name='A. Pekerjaan SIPIL')).to_be_visible(timeout=30000)
    expect(page.get_by_role('heading',name='B. Pekerjaan ME')).to_be_visible()
    expect(page.get_by_text('Item SIPIL',exact=True)).to_be_visible()
    expect(page.get_by_text('Item ME',exact=True)).to_be_visible()
    text=page.locator('body').inner_text()
    assert text.index('A. Pekerjaan SIPIL')<text.index('Item SIPIL')<text.index('B. Pekerjaan ME')<text.index('Item ME')
    page.screenshot(path=str(out/'detail.png'),full_page=True)
    (out/'requests.json').write_text(json.dumps(requests),encoding='utf8')
    browser.close()
print('PASS: grouped RAB detail contains ordered scopes and their items; all APIs mocked')
