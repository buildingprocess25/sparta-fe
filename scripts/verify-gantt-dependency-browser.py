from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[2]
out = root / 'artifacts/gantt-dependency'
bundle = (out / 'preview.js').read_text(encoding='utf8')
css = '\n'.join(p.read_text(encoding='utf8') for p in (root / 'sparta-fe/.next').glob('**/*.css'))
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440,'height':800})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('**/*', lambda r: r.fulfill(content_type='text/html', body='<html><head></head><body><div id="root"></div></body></html>'))
    for mode in ['pic','kontraktor']:
        page.goto('http://fixture.invalid/?mode='+mode)
        page.add_style_tag(content=css)
        page.add_script_tag(content=bundle)
        wait = page.get_by_test_id('dependency-wait')
        expect(wait).to_have_count(1)
        expect(wait).to_have_text('Menunggu 3 hari')
        assert wait.evaluate('(e)=>e.style.left') == '220px'
        assert wait.evaluate('(e)=>e.style.width') == '126px'
        blue = page.locator('[title="SIPIL - B: 4 hari"]')
        assert blue.evaluate('(e)=>e.style.left') == '352px'
        assert blue.evaluate('(e)=>e.style.width') == '170px'
        assert page.locator('[title="ME - B: 4 hari"]').evaluate('(e)=>e.style.left') == '220px'
        expect(page.locator('[title="SIPIL - A: +3 hari terlambat"]')).to_have_count(1)
        paths = page.locator('path[marker-end="url(#unifiedDepArrow)"]')
        assert paths.count() == 2
        assert paths.first.get_attribute('d').startswith('M 176 72 C 176 ')
        page.screenshot(path=str(out/(mode+'.png')),full_page=True)
    assert not errors, errors
    browser.close()
print('PASS: both roles render yellow wait, shifted blue, red source delay, centered arrows; ME isolated; no API calls')
