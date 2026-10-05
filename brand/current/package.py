"""Build an audited manifest and deterministic portable ZIP (no dependency installation)."""
from pathlib import Path
import hashlib,json,zipfile
P=Path(__file__).resolve().parent
excluded={'downloads','__pycache__','node_modules','.venv','.DS_Store','manifest.json','verification.json'}
files=[p for p in sorted(P.rglob('*')) if p.is_file() and not any(x in excluded for x in p.relative_to(P).parts)]
manifest={str(p.relative_to(P)):{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files}
(P/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');files.append(P/'manifest.json')
(P/'downloads').mkdir(exist_ok=True)
with zipfile.ZipFile(P/'downloads/storyfeed-current-kit.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(files):
  entry=zipfile.ZipInfo('storyfeed-current/'+str(p.relative_to(P)),(2026,10,5,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o100644<<16;z.writestr(entry,p.read_bytes())
print('Packaged',len(files),'files:',(P/'downloads/storyfeed-current-kit.zip').stat().st_size,'bytes')
