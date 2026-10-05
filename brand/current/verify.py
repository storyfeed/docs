"""Focused current-kit packaging, README pixels and accessible fallback checks. No old motion suite."""
from pathlib import Path
import hashlib,json,zipfile,tempfile,subprocess,io
from PIL import Image,ImageChops
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parent;sha=lambda b:hashlib.sha256(b).hexdigest()
frozen=json.loads((P/'source/frozen-assets.json').read_text())
for name,record in frozen.items():assert sha((P/name).read_bytes())==record['sha256'],name
manifest=json.loads((P/'manifest.json').read_text())
for name,record in manifest.items():assert sha((P/name).read_bytes())==record['sha256'],name
archive=P/'downloads/storyfeed-current-kit.zip';before=archive.read_bytes();subprocess.run(['python3',str(P/'package.py')],check=True);assert archive.read_bytes()==before
for theme in ['light','dark']:
 gif=Image.open(P/f'banners/storyfeed-animated-{theme}.gif');assert gif.size==(1600,428) and gif.info['loop']==0
 assert Image.open(P/f'banners/storyfeed-static-{theme}.png').size==(1600,428)
 duration=0;words=None;bodies=set()
 background=(255,255,255) if theme=='light' else (13,17,23)
 gif.seek(0);first=gif.convert('RGB');colours=set(first.getdata())
 for colour in [(217,160,8) if theme=='light' else (251,191,36),(182,83,38),(67,141,152)]:assert colour in colours,(theme,colour)
 assert Image.open(P/f'banners/storyfeed-static-{theme}.png').convert('RGB').getpixel((1599,427))==background
 for i in range(gif.n_frames):
  gif.seek(i);duration+=gif.info['duration'];rgb=gif.convert('RGB');text=rgb.crop((420,0,1600,428)).tobytes()
  assert rgb.getpixel((1599,427))==background,(theme,i)
  if words is None:words=text
  assert text==words,('stationary outlined text changed',theme,i)
  bodies.add(sha(rgb.crop((0,0,410,428)).tobytes()))
 assert duration==33750 and len(bodies)>90
class H(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
with tempfile.TemporaryDirectory(prefix='storyfeed-current-') as tmp:
 with zipfile.ZipFile(archive) as z:
  assert all(not any(x in n.split('/') for x in ['node_modules','.env','.venv','evidence','downloads','__pycache__']) for n in z.namelist())
  for name in manifest:assert z.read('storyfeed-current/'+name)==(P/name).read_bytes()
  z.extractall(tmp)
 root=Path(tmp)/'storyfeed-current';server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}'
 checks=[]
 with sync_playwright() as pw:
  b=pw.chromium.launch(channel='chrome')
  for theme,width,rm in [('light',1000,'no-preference'),('dark',1000,'no-preference'),('light',390,'reduce'),('dark',390,'reduce')]:
   page=b.new_page(viewport={'width':width,'height':900},color_scheme=theme,reduced_motion=rm)
   page.goto(url+'/readme-preview.html');page.locator('picture img').evaluate('(e)=>e.decode()')
   result=page.locator('picture img').evaluate('(e)=>({src:e.currentSrc,naturalWidth:e.naturalWidth,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})')
   assert result['naturalWidth']==1600
   assert (('static-light' if rm=='reduce' else 'animated-'+theme)) in result['src'],result
   assert result['width']==(800 if width==1000 else 358),result
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   checks.append({'theme':theme,'viewport':width,'reduced_motion':rm,**result});page.close()
  page=b.new_page(viewport={'width':390,'height':900});page.goto(url+'/');page.wait_for_function('Array.from(document.images).every(e=>e.complete&&e.naturalWidth>0)')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.get_by_label('Wordmark treatment').select_option('feed-teal');page.locator('#lock-light').evaluate('(e)=>e.decode()');assert 'feed-teal' in page.locator('#lock-light').get_attribute('src')
  page.goto(url+'/motion/hero.html');page.wait_for_function('window.queueReview');assert page.locator('#queue').get_attribute('data-front') is not None
  page.goto(url+'/harness/site/');assert page.locator('[role=listitem]').count()==8
  b.close()
 server.shutdown()
result={'frozen_files':len(frozen),'manifest_files':len(manifest),'archive_repeat_exact':True,'archive_bytes':len(before),'gif_dimensions':[1600,428],'gif_duration_ms':33750,'stationary_text_all_frames':True,'exact_brand_colours_first_frame':True,'exact_github_background_all_frames':True,'github_api_html_picture_selection':checks,'standalone_review_hero_native_fixture':True,'old_motion_suite':'not rerun','hosted_github_readme':'pending approved push; API HTML/local browser only'}
(P/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
