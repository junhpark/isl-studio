#!/usr/bin/env python3
"""cases/lib/*/results.json → cases/index.json (스튜디오 패턴 탭의 참조해 목록).
   각 항목에는 스튜디오 설정을 그 케이스에 맞추는 데 필요한 값이 들어 있다."""
import json, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLABEL = {'5spot': '5-spot', '7spot': '7-spot', 'line': 'Line drive'}
ORDER = {'5spot': 0, '7spot': 1, 'line': 2}
DEFAULT = '5spot_s50_bp5'   # = cases/base


def entry(case_dir):
    r = json.load(open(os.path.join(case_dir, 'results.json'), encoding='utf-8'))
    sc = r['scenario']; w = sc['wells']; aq = sc['aquifer']; cid = os.path.basename(case_dir)
    ff = r.get('fields_file', 'fields.bin'); size = os.path.getsize(os.path.join(case_dir, ff))
    b = w['bleed']; sign = '+' if b >= 0 else '−'
    return {
        'id': cid, 'default': cid == DEFAULT,
        'label': f"{PLABEL[w['pattern']]} · {w['spacing_m']:g} m · bleed {sign}{abs(b)*100:g} %",
        'path': 'ogs1/cases/lib/' + cid, 'fields_file': ff, 'bytes': size,
        'settings': {'pattern': w['pattern'], 'spacing': w['spacing_m'], 'n': w['n'], 'outer': w['outer_producers'],
                     'Q': w['Q_inj_m3_per_d'], 'bleed': b, 'conc': sc['chemistry']['lixiviant_conc_mol_m3'],
                     'K': aq['K_m_per_d'], 'grad': aq['regional_gradient'], 'aL': aq['dispersivity_L_m'], 'aT': aq['dispersivity_T_m']},
        'domain_m': r['domain_m'], 'pv_days': r['pv_days'], 'frames': len(r['times_days']), 't_end_days': r['times_days'][-1],
    }


if __name__ == '__main__':
    cases = [entry(d) for d in glob.glob(os.path.join(ROOT, 'cases', 'lib', '*')) if os.path.exists(os.path.join(d, 'results.json'))]
    cases.sort(key=lambda e: (ORDER[e['settings']['pattern']], e['settings']['spacing'], -e['settings']['bleed']))
    out = {'version': 1, 'source': 'OpenGeoSys 6.5.9 ComponentTransport (추적자, 이류형 + IsotropicDiffusion 0.5)',
           'note': '도메인은 스튜디오 genWells() 공식과 같다. 비교 시 교환성 품위를 최소로 두어 화학 반응을 끈다.', 'cases': cases}
    json.dump(out, open(os.path.join(ROOT, 'cases', 'index.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print(f"cases/index.json: {len(cases)}개, 필드 합계 {sum(c['bytes'] for c in cases)/1e6:.1f} MB")
    for c in cases: print(f"  {c['id']:16s} {c['label']:28s} 도메인 {c['domain_m']:6.1f} m  {c['bytes']/1e6:5.2f} MB")
