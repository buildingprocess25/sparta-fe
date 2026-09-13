from pathlib import Path
exec(Path(__file__).with_name('verify-rab-document-browser.py').read_text(encoding='utf8').split('with sync_playwright() as pw:')[0])
sipil['items'][0]['kategori_pekerjaan']='PEKERJAAN PERSIAPAN'
for s in [sipil,me]:
    s['rab']['status']='Ditolak oleh Manajer'
    s['rab']['alasan_penolakan']='Perbaiki kedua lingkup'
    s['revisi_items']=[dict(id_rab_item=s['rab']['id'],catatan_item='Catatan revisi '+s['toko']['lingkup_pekerjaan'])]
for row in listed:row['status']='Ditolak oleh Manajer'
base_route=route
def route(r):
    u=urlparse(r.request.url)
    if u.path in ['/api/rab/1','/api/rab/2']:
        requests.append(u.path)
        r.fulfill(json={'status':'success','data':sipil if u.path.endswith('/1') else me});return
    if u.path.startswith('/api/toko/'):
        r.fulfill(json={'status':'success','data':sipil['toko']});return
    if u.port==8081 and '/api/' not in u.path:
        r.fulfill(json={});return
    base_route(r)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.route('**/*',route)
    context.add_init_script("""for(const [k,v] of Object.entries({authenticated:'true',userRole:'KONTRAKTOR',nama_pt:'CV FIXTURE',loggedInUserEmail:'fixture@example.invalid',loggedInUserCabang:'HEAD OFFICE',spartaAccessToken:'synthetic-token'}))sessionStorage.setItem(k,v);""")
    page=context.new_page()
    for id in [1,2]:
        page.goto('http://localhost:3000/rab?revision_id='+str(id),wait_until='domcontentloaded',timeout=90000)
        expect(page.get_by_text('Data revisi berhasil dimuat ke dalam form.',exact=True)).to_be_visible(timeout=60000)
        page.get_by_role('button',name='Mengerti',exact=True).click()
        expect(page.get_by_placeholder('Ketik jenis pekerjaan...').nth(0)).to_have_value('Item SIPIL')
        expect(page.get_by_placeholder('Ketik jenis pekerjaan...').nth(1)).to_have_value('Item ME')

        assert 'Catatan revisi SIPIL' in page.locator('body').text_content()
        assert 'Catatan revisi ME' in page.locator('body').text_content()
        assert '/api/rab/1' in requests and '/api/rab/2' in requests
    page.screenshot(path=str(out/'revision-both-scopes.png'),full_page=True)
    browser.close()
print('PASS: SIPIL and ME revision links load both scopes and both item revision notes; no submission or real API calls')




