import asyncio, os, shutil, json, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = shutil.which('google-chrome') or shutil.which('chromium')
RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 3
DIFF = sys.argv[2] if len(sys.argv) > 2 else 'normal'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pg = await b.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + ROOT + '/index.html'); await pg.wait_for_timeout(300)
        await pg.add_script_tag(path=os.path.join(ROOT, 'tools', 'bot.js'))
        print(f"{'#':>2} {'mission':12} {'perScr':>6} {'perMin':>6} {'reach':>9} {'time':>5}  worst columns (hits)")
        for idx in range(12):
            rs = [await pg.evaluate(f"runBot({idx}, {{diff: '{DIFF}'}})") for _ in range(RUNS)]
            avg = lambda k: sum(r[k] for r in rs) / len(rs)
            r = rs[0]
            print(f"{idx+1:>2} {r['id']:12} {avg('perScreen'):6.2f} {avg('perMin'):6.1f} {int(avg('maxCol')):>4}/{r['width']:<4} {avg('time'):5.0f}  {r['worst']}" + (f"  base={r['base']}" if r['base'] is not None else ''))
        print('errors', errs[:3])
        await b.close()
asyncio.run(main())
