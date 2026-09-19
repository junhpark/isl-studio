#!/usr/bin/env python3
"""시나리오 라이브러리 생성 + 배치 실행.
   3패턴 × 2간격 × 2 bleed = 12 케이스. 각 케이스: make_case → ogs → run_case(후처리)."""
import json, os, sys, subprocess, copy, time, itertools

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASE = json.load(open(os.path.join(ROOT, 'schema', 'example.pattern.json')))

PATTERNS = ['5spot', '7spot', 'line']
SPACINGS = [30.0, 50.0]
BLEEDS   = [0.05, -0.10]

def case_name(p, s, b):
    return f"{p}_s{int(s)}_b{'p' if b>=0 else 'm'}{abs(int(round(b*100)))}"

def build_scenarios():
    out = []
    for p, s, b in itertools.product(PATTERNS, SPACINGS, BLEEDS):
        sc = copy.deepcopy(BASE)
        sc['wells']['pattern'] = p; sc['wells']['spacing_m'] = s; sc['wells']['bleed'] = b
        sc['wells']['list'] = []
        sc['provenance'] = {'exported_from': 'make_library.py', 'case': case_name(p, s, b), 'date': time.strftime('%Y-%m-%d')}
        out.append((case_name(p, s, b), sc))
    return out

def run_one(name, sc, lib_dir):
    d = os.path.join(lib_dir, name); os.makedirs(d, exist_ok=True)
    scn = os.path.join(d, 'scenario.json'); json.dump(sc, open(scn, 'w'), indent=1)
    if os.path.exists(os.path.join(d, 'results.json')):
        print(f'[skip] {name} already done'); return
    t0 = time.time()
    subprocess.run([sys.executable, os.path.join(HERE, 'make_case.py'), scn, d], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, os.path.join(HERE, 'run_case.py'), d], check=True)
    # 대용량 VTU 정리 (fields.bin 에 이미 다운샘플됨)
    for f in os.listdir(d):
        if f.startswith('pattern_ts_') or f == 'pattern.pvd': os.remove(os.path.join(d, f))
    print(f'[done] {name}  {time.time()-t0:.0f}s')

if __name__ == '__main__':
    lib_dir = os.path.join(ROOT, 'cases', 'lib')
    scns = build_scenarios()
    # 워커 분할: --worker k/n
    k, n = 0, 1
    if '--worker' in sys.argv:
        k, n = map(int, sys.argv[sys.argv.index('--worker')+1].split('/'))
    mine = [x for i, x in enumerate(scns) if i % n == k]
    print(f'worker {k}/{n}: {[m[0] for m in mine]}')
    for name, sc in mine:
        run_one(name, sc, lib_dir)
