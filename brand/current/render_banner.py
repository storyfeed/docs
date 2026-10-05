"""Capture approved queue renderer, unchanged, in the frozen repository-banner layout."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import copy,io,json,xml.etree.ElementTree as ET
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parent
NS='http://www.w3.org/2000/svg';ET.register_namespace('',NS)
BACKGROUNDS={'light':'#FFFFFF','dark':'#0d1117'}
def banner(theme):
 r=ET.parse(P/f'banners/repository-{theme}.svg').getroot()
 next(c for c in r if c.tag==f'{{{NS}}}rect').set('fill',BACKGROUNDS[theme])
 return r
controls='<div hidden><select id="theme"><option>light</option><option>dark</option></select><button id="pause"></button><button id="replay"></button><button id="previous"></button><button id="next"></button><span id="status"></span></div>'
for theme in ['light','dark']:
 r=banner(theme)
 # Remove only the frozen mark placement; replace with the actual queue renderer at the same bounds.
 g=next(c for c in r if c.get('transform')=='translate(24 24) scale(.34)');r.remove(g)
 background=ET.tostring(r,encoding='unicode')
 html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Storyfeed README banner capture</title><link rel="stylesheet" href="motion/queue.css"><style>html,body{margin:0;background:BACKGROUND} .banner{position:relative;width:800px;height:214px;overflow:hidden}.backdrop{position:absolute;inset:0}.backdrop>svg{width:800px;height:213.333333px}.banner .art{position:absolute;left:16px;top:16px;width:181.333333px;height:181.333333px;max-width:none}</style><div class="banner"><div class="backdrop">'+background+'</div><div class="art"><img id="fallback" alt="Storyfeed" src="marks/mark-light.svg"><svg id="queue" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg"></svg></div></div>'+controls+'<script src="motion/queue.js"></script></html>'
 (P/f'banners/capture-{theme}.html').write_text(html.replace('href="motion/','href="../motion/').replace('src="motion/','src="../motion/').replace('src="marks/','src="../marks/').replace('<head>','<head>'))
 # queue.js resolves fallback relative to this document, so expose capture at kit root instead.
 (P/f'capture-{theme}.html').write_text(html.replace('BACKGROUND',BACKGROUNDS[theme]))
 (P/f'banners/capture-{theme}.html').unlink()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(P)));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
results={}
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome');page=b.new_page(viewport={'width':800,'height':214},device_scale_factor=2)
 for theme in ['light','dark']:
  page.goto(f'{base}/capture-{theme}.html?theme={theme}');page.wait_for_function('window.queueReview');frames=[];durations=[]
  for i in range(9):
   for offset,duration in [(0,3000)]+[(3000+k*50,50) for k in range(15)]:
    page.evaluate('(t)=>queueReview.seek(t)',i*3750+offset)
    frames.append(Image.open(io.BytesIO(page.locator('.banner').screenshot(scale='device'))).convert('RGB'));durations.append(duration)
  # One global palette avoids palette flicker; no dithering on geometric artwork.
  sample=Image.new('RGB',(160,43*len(frames)))
  for i,frame in enumerate(frames):sample.paste(frame.resize((160,43)),(0,43*i))
  reserved=['#FFFFFF','#0d1117','#17434B','#438D98','#8EB8BD','#D9A008','#FBBF24','#B65326','#28231F','#FAF6EF']
  colours=[tuple(bytes.fromhex(c[1:])) for c in reserved]
  adaptive=sample.quantize(colors=256-len(colours),method=Image.Quantize.MEDIANCUT).getpalette()
  palette=Image.new('P',(1,1))
  palette.putpalette([v for c in colours for v in c]+adaptive[:(256-len(colours))*3])
  indexed=[]
  for frame in frames:
   quantized=frame.quantize(palette=palette,dither=Image.Dither.NONE)
   # Pillow nearest-colour lookup uses a coarse cache; explicitly pin flat source colours.
   for index,colour in enumerate(colours):
    channels=ImageChops.difference(frame,Image.new('RGB',frame.size,colour)).split()
    distance=ImageChops.lighter(ImageChops.lighter(channels[0],channels[1]),channels[2])
    quantized.paste(index,mask=distance.point(lambda value:255 if value==0 else 0))
   indexed.append(quantized)
  dest=P/f'banners/storyfeed-animated-{theme}.gif';indexed[0].save(dest,save_all=True,append_images=indexed[1:],duration=durations,loop=0,optimize=True,disposal=1)
  # Exact selected07 static mark in the identical outlined banner, not a paused queue substitute.
  page.emulate_media(reduced_motion='reduce');page.wait_for_function('document.querySelector(".art").classList.contains("reduced")');page.locator('#fallback').evaluate('(e)=>e.decode()')
  page.locator('.banner').screenshot(path=str(P/f'banners/storyfeed-static-{theme}.png'),scale='device')
  page.emulate_media(reduced_motion='no-preference')
  r=banner(theme);r.set('width','800');r.set('height','214');(P/f'banners/storyfeed-static-{theme}.svg').write_text(ET.tostring(r,encoding='unicode')+'\n')
  im=Image.open(dest);total=0
  for n in range(im.n_frames):im.seek(n);total+=im.info['duration']
  results[theme]={'dimensions':list(im.size),'frames':im.n_frames,'duration_ms':total,'loop':im.info.get('loop'),'bytes':dest.stat().st_size,'renderer':'byte-identical iteration09 queue.js','capture_fps_during_transition':20,'hold_ms':3000,'advance_ms':750}
  assert im.size==(1600,428)
  assert Image.open(P/f'banners/storyfeed-static-{theme}.png').size==(1600,428)
  assert total==33750
 b.close()
server.shutdown();(P/'source/banner-render.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(results,indent=2))
