#!/usr/bin/env python3
"""참조해 필드 파일 읽기·쓰기 (v1 · v2 공용).

v1  fields.bin          Float32 [T][2][N]  (field 0 = head_m, 1 = tracer_frac)      — 무압축, 케이스당 2–8 MB
v2  fields.v2.bin.gz    gzip( head_f32[H][N] + tracer_u16[T][N] )                     — 케이스당 0.2–1.5 MB
    · 저류가 0 이라 수두는 정호 유량이 같은 동안 변하지 않는다. 서로 다른 수두장 H 개(침출·복원이면 2)만 저장하고
      fields_format.head_index[T] 가 프레임별 수두장 번호를 준다. head_index 가 없으면 H = 1.
      프레임 0(초기조건 h = 0)은 첫 수두장으로 채워 읽는다.
    · 추적자는 [-0.25, 1.25] 구간을 16비트로 양자화한다. 최대 오차 1.2e-5 (주입 농도 대비).
      FEM 수치 진동으로 생기는 약한 음수(−0.1 정도)도 그대로 보존된다.
results.json 의 fields_file · fields_format 이 형식을 알려 준다. 없으면 v1 로 본다.

사용:  from fields_io import read_fields;  res, arr = read_fields(case_dir)   # arr: float32 [T][2][N]
       python fields_io.py convert <case_dir> [...]   # v1 → v2 변환, fields.bin 은 남겨 둔다
"""
import gzip, json, os, sys
import numpy as np

V2_NAME = 'fields.v2.bin.gz'
TR_OFFSET = -0.25
TR_SCALE = 1.5 / 65535.0


def write_v2(case_dir, arr, tol=1e-4):
    """arr: float32 [T][2][N]. 파일을 쓰고 results.json 에 넣을 형식 정보를 돌려준다."""
    arr = np.asarray(arr, np.float32); T, F, N = arr.shape
    assert F == 2, 'field 축은 [head, tracer] 두 개여야 합니다'
    heads, index = [], []
    for k in range(T):
        if k == 0 and T > 1: index.append(None); continue          # 초기조건 — 뒤에서 첫 수두장으로
        h = arr[k, 0]
        if heads and float(np.abs(h - heads[-1]).max()) <= tol: index.append(len(heads) - 1); continue
        if any(float(np.abs(h - g).max()) <= tol for g in heads[:-1]):
            raise ValueError('수두장이 이전 값으로 되돌아갑니다 — 지원하지 않는 일정입니다')
        heads.append(h.astype('<f4')); index.append(len(heads) - 1)
        if len(heads) > 8: raise ValueError(f'수두장이 {len(heads)}개 이상 — 비정상류로 보입니다. v1 을 쓰십시오.')
    index = [0 if i is None else i for i in index]
    q = np.clip(np.round((arr[:, 1] - TR_OFFSET) / TR_SCALE), 0, 65535).astype('<u2')
    with gzip.open(os.path.join(case_dir, V2_NAME), 'wb', compresslevel=9) as f:
        for h in heads: f.write(h.tobytes())
        f.write(q.tobytes())
    ff = {'version': 2, 'gzip': True, 'layout': 'head_f32[H][N] + tracer_u16[T][N], little-endian',
          'head': 'piecewise-steady; head_index[k] = head field used by frame k (frame 0 uses the first)',
          'tracer_offset': TR_OFFSET, 'tracer_scale': TR_SCALE, 'quantization_max_error': TR_SCALE / 2}
    if len(heads) > 1: ff['head_index'] = index
    return {'fields_file': V2_NAME, 'fields_format': ff}


def read_fields(case_dir):
    """(results dict, float32 [T][2][N]) — v1·v2 모두."""
    res = json.load(open(os.path.join(case_dir, 'results.json'), encoding='utf-8'))
    T = len(res['times_days']); N = res['nx'] * res['ny']
    ff = res.get('fields_format') or {}
    if ff.get('version') == 2:
        raw = open(os.path.join(case_dir, res.get('fields_file', V2_NAME)), 'rb').read()
        if ff.get('gzip', True) and raw[:2] == b'\x1f\x8b': raw = gzip.decompress(raw)
        idx = ff.get('head_index') or [0] * T; H = max(idx) + 1
        heads = np.frombuffer(raw, '<f4', H * N, 0).reshape(H, N)
        tr = np.frombuffer(raw, '<u2', T * N, H * N * 4).reshape(T, N).astype(np.float32) * np.float32(ff['tracer_scale']) + np.float32(ff['tracer_offset'])
        arr = np.empty((T, 2, N), np.float32); arr[:, 0] = heads[idx]; arr[:, 1] = tr
        return res, arr
    return res, np.fromfile(os.path.join(case_dir, 'fields.bin'), np.float32).reshape(T, 2, N)


def convert(case_dir):
    res, arr = read_fields(case_dir)
    if (res.get('fields_format') or {}).get('version') == 2:
        print(f'  이미 v2: {case_dir}'); return
    info = write_v2(case_dir, arr); res.update(info)
    json.dump(res, open(os.path.join(case_dir, 'results.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    _, back = read_fields(case_dir)
    err_c = float(np.abs(back[:, 1] - arr[:, 1]).max()); err_h = float(np.abs(back[1:, 0] - arr[1:, 0]).max()) if len(arr) > 1 else 0.0
    v1 = arr.nbytes; v2 = os.path.getsize(os.path.join(case_dir, V2_NAME))
    print(f'  {os.path.basename(case_dir.rstrip("/")):16s} v1 {v1/1e6:5.2f} MB → v2 {v2/1e6:5.2f} MB   되읽기 오차: 추적자 {err_c:.1e}, 수두 {err_h:.1e} m')


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'convert':
        for d in sys.argv[2:]: convert(d)
    else:
        print(__doc__)
