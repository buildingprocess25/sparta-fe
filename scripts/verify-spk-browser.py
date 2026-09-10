import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

OUT = Path(__file__).resolve().parents[2] / 'artifacts' / 'spk-browser'
OUT.mkdir(parents=True, exist_ok=True)
base = dict(cabang='HEAD OFFICE', nama_toko='TOKO UJI GABUNGAN', kode_toko='BELUM DIISI', nama_pt='CV FIXTURE', proyek='Reguler', durasi_pekerjaan='30', spk_group_id=None)
combined = dict(base, id_toko=1, nomor_ulok='Z001-UJI-0001', lingkup_pekerjaan='SIPIL + ME', member_toko_ids=[1,2], grand_total_final=300000,
    group_members=[dict(id_toko=1,lingkup_pekerjaan='SIPIL',grand_total=100000),dict(id_toko=2,lingkup_pekerjaan='ME',grand_total=200000)])
single = dict(base,id_toko=3,nomor_ulok='Z001-UJI-0002',lingkup_pekerjaan='ME',member_toko_ids=[3],grand_total_final=50000,group_members=[])
blocked = dict(combined,id_toko=4,nomor_ulok='Z001-UJI-0003',member_toko_ids=[4,5],blocked_reason='Kontraktor RAB SIPIL dan ME berbeda. Samakan data kontraktor sebelum mengajukan SPK gabungan.')
for row in [combined,single,blocked]: row['toko']=dict(id=row['id_toko'],kode_toko='BELUM DIISI',nama_toko=row['nama_toko'],alamat='Alamat sintetis',cabang='HEAD OFFICE')
submitted=[]
requests=[]
def intercept(route):
    req=route.request
    target=urlparse(req.url)
    if '/api/' in target.path:
        requests.append(dict(method=req.method,path=target.path))
        data=[]
        if target.path.endswith('/spk/candidates'): data=[combined,single,blocked]
        elif target.path.endswith('/get_kontraktor'):
            route.fulfill(json=['CV FIXTURE']); return
        elif 'system-maintenance' in target.path: data={'is_active':False}
        elif 'system-access-schedule' in target.path: data={'is_enabled':False}
        elif 'spk-backdate-policy' in target.path: data={'enabled_branches':['HEAD OFFICE']}
        elif target.path.endswith('/spk/submit'):
            submitted.append(req.post_data_json); data={'id':101}
        route.fulfill(json={'status':'success','data':data}); return
    if target.hostname not in ['127.0.0.1','localhost']:
        route.abort(); return
    route.continue_()

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.route('**/*',intercept)
    context.add_init_script("""for (const [k,v] of Object.entries({authenticated:'true',userRole:'BRANCH BUILDING & MAINTENANCE MANAGER',loggedInUserEmail:'fixture@example.invalid',loggedInUserCabang:'HEAD OFFICE',spartaAccessToken:'synthetic-token'})) sessionStorage.setItem(k,v);""")
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://localhost:3000/spk',wait_until='domcontentloaded',timeout=90000)
    choice=page.locator('select').filter(has=page.locator('option',has_text='Z001-UJI-0001'))
    expect(choice).to_be_visible(timeout=90000)
    choice.select_option('toko:1,2')
    expect(page.get_by_text('Satu pengajuan, dokumen, dan approval untuk SIPIL + ME.')).to_be_visible()
    expect(page.get_by_text('Silakan lengkapi form untuk pengajuan SPK baru.')).to_be_visible(timeout=15000)
    page.screenshot(path=str(OUT/'combined.png'),full_page=True)
    assert page.locator('input[placeholder="Otomatis dari RAB"]').last.input_value()=='30'
    choice.select_option('toko:3')
    expect(page.get_by_text('Satu pengajuan, dokumen, dan approval untuk SIPIL + ME.')).not_to_be_visible()
    expect(page.get_by_text('Silakan lengkapi form untuk pengajuan SPK baru.')).to_be_visible()
    page.screenshot(path=str(OUT/'single.png'),full_page=True)
    choice.select_option('toko:4,5')
    expect(page.get_by_text(blocked['blocked_reason'])).to_be_visible()
    expect(page.locator('button[type="submit"]')).to_be_disabled()
    choice.select_option('toko:1,2')
    expect(page.get_by_text('Silakan lengkapi form untuk pengajuan SPK baru.')).to_be_visible()
    assert page.locator('input[placeholder="Otomatis dari RAB"]').last.get_attribute('readonly') is not None
    assert page.locator('input[placeholder="T123"]').input_value() == ''
    page.locator('input[placeholder="T123"]').fill('T123')
    page.get_by_placeholder('Bulan (X)',exact=True).first.fill('IX')
    page.get_by_placeholder('No',exact=True).fill('123')
    page.get_by_placeholder('Bulan (X)',exact=True).nth(1).fill('IX')
    page.get_by_role('button',name='Pilih tanggal',exact=True).click()
    # Calendar DOM is captured before choosing an observed available day.
    (OUT/'calendar.html').write_text(page.content(),encoding='utf8')
    buttons=page.get_by_role('grid').get_by_role('button').all()
    available=[button for button in buttons if button.is_enabled()]
    assert available, 'No selectable day in calendar'
    available[-1].click()
    page.locator('button[type="submit"]').click()
    page.wait_for_function('document.body.innerText.includes("Berhasil") || document.body.innerText.includes("berhasil")')
    assert len(submitted)==1,submitted
    assert submitted[0]['member_toko_ids']==[1,2]
    assert submitted[0]['lingkup_pekerjaan']=='SIPIL + ME'
    assert submitted[0]['grand_total']==300000
    assert submitted[0]['durasi']==30
    assert not errors,errors
    (OUT/'result.json').write_text(json.dumps({'submitted':submitted,'requests':requests,'page_errors':errors},indent=2),encoding='utf8')
    browser.close()
    print('PASS: combined/single/blocker form, single mocked submit with both member IDs and shared fields; no real API calls')
