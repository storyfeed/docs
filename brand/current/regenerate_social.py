"""Reapply the approved iteration10 transform to included frozen iteration08 SVG inputs."""
from pathlib import Path
import copy,xml.etree.ElementTree as ET
P=Path(__file__).resolve().parent;NS='http://www.w3.org/2000/svg';ET.register_namespace('',NS)
for theme in ('light','dark'):
 root=ET.parse(P/f'source/social10/source/baseline-{theme}.svg').getroot();group=ET.Element('{'+NS+'}g',{'data-composition':'shared-centered-feature','transform':'translate(189.12 -43.48) scale(1.08)'})
 for child in list(root):
  if child.tag=='{'+NS+'}title':child.text='Storyfeed — centered feature, eight percent larger / '+theme
  elif child.tag!='{'+NS+'}rect' or child.get('data-focus')=='true':root.remove(child);group.append(child)
 root.append(group)
 for crop in (False,True):
  output=copy.deepcopy(root);suffix='-crop' if crop else ''
  if crop:output.set('width','1200');output.set('height','630');output.set('viewBox','57.142857 0 2285.714286 1200')
  (P/f'social/baseline-{theme}{suffix}.svg').write_text(ET.tostring(output,encoding='unicode')+'\n')
print('Regenerated four SVGs from frozen inputs. Included PNG/JPGs remain the approved exports.')
