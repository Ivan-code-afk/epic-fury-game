import asyncio, os, shutil, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHROME = shutil.which('google-chrome') or shutil.which('chromium')
DIFF = sys.argv[1] if len(sys.argv) > 1 else 'normal'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        pg = await b.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + ROOT + '/index.html'); await pg.wait_for_timeout(300)
        await pg.add_script_tag(path=os.path.join(ROOT, 'tools', 'bot.js'))
        for idx in (4, 11):
            for _ in range(3): print(await pg.evaluate(f"runBoss({idx}, {{diff:'{DIFF}'}})"))
        print('errors', errs[:3])
        await b.close()
asyncio.run(main())
