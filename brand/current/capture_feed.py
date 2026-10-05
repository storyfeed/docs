"""Capture unmodified native website renderer and verify local-only repeatability."""
from pathlib import Path
import json,io
from PIL import Image
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
P=Path(__file__).resolve().parent
(P/'captures').mkdir(exist_ok=True)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
class S(ThreadingHTTPServer):request_queue_size=128
server=S(('127.0.0.1',0),partial(H,directory=str(P)));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}'
results={};blocked=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 for mode in ('light','dark'):
  outputs=[]
  for run in range(2):
   page=browser.new_page(viewport={'width':900,'height':1200},device_scale_factor=2,locale='en-US',timezone_id='UTC',reduced_motion='reduce')
   def route(r):
    if r.request.url.startswith(url+'/') or r.request.url.startswith('data:'):r.continue_()
    else:blocked.append(r.request.url);r.abort()
   page.route('**/*',route);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/harness/site/?theme='+mode,wait_until='networkidle');page.evaluate('document.body.dataset.capture="true"');page.evaluate('document.fonts.ready')
   page.wait_for_selector('.sf-feed');assert page.locator('[role=listitem]').count()==8
   assert 'Jasper unveiled Storyfeed at GPUG' in page.locator('#capture').inner_text()
   assert page.locator('.sf-avatar').count()==8 and page.locator('.sf-rail__line').count()==7
   metrics=page.locator('.sf-feed').evaluate('e=>{const row=e.querySelector(".sf-row"),body=e.querySelector(".sf-body"),rail=e.querySelector(".sf-rail"),line=e.querySelector(".sf-rail__line");return {width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,font:getComputedStyle(e).fontFamily,fontSize:getComputedStyle(e).fontSize,lineHeight:getComputedStyle(e).lineHeight,gap:getComputedStyle(row).gap,gutter:getComputedStyle(rail).width,bodyPadding:getComputedStyle(body).paddingTop,bodySpacing:getComputedStyle(body).paddingBottom,railWidth:getComputedStyle(line).width,rows:[...e.querySelectorAll("[role=listitem]")].map(n=>n.getBoundingClientRect().height)}}')
   assert metrics['width']==560 and abs(metrics['height']-370.734375)<.001
   assert metrics['fontSize']=='14px' and metrics['gap']=='12px' and metrics['gutter']=='32px' and metrics['bodySpacing']=='20px' and metrics['railWidth']=='1px';assert page.evaluate('document.fonts.check("14px Instrument Sans")')
   raw=page.locator('#capture').screenshot(omit_background=True);outputs.append(raw);im=Image.open(io.BytesIO(raw));assert im.convert('RGBA').getchannel('A').getextrema()[0]==0
   if run==0:(P/f'captures/feed-{mode}.png').write_bytes(raw);results[mode]=metrics;results[mode]['pixels']=list(im.size);results[mode]['text']=page.locator('#capture').inner_text()
   page.close()
  assert outputs[0]==outputs[1],mode;results[mode]['exact_repeat']=True
 assert not blocked and not errors;(P/'captures/renderer-verification.json').write_text(json.dumps({'metrics':results,'nonlocal_requests':blocked,'page_errors':errors},indent=2)+'\n');browser.close()
server.shutdown();print('PASS genuine renderer: 8 items, native spacing, local-only, transparent and exact-repeat light/dark')
