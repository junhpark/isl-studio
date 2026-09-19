# ISL Studio

이온흡착형 중희토류 광상의 **사면 중력식 현장침출**과 피압대수층의 **정호 패턴식 ISL**을 한 화면에서 비교하는 브라우저 프로토타입.
단일 HTML 파일(three.js)로 실행되며, OpenGeoSys 6.5.9 참조해를 불러와 근사 모델과 겹쳐 볼 수 있다.

> 예시용 프로토타입이다. 거친 근사 모델이며 설계·인허가·환경영향평가의 근거로 쓸 수 없다.
> 기본값은 공개 문헌 인용치이고 특정 광산의 실측값이 아니다.

## 실행

| 파일 | 용도 |
|---|---|
| `isl-studio.html` | 기본판. three.js r128을 CDN에서 불러오므로 처음 열 때 인터넷 필요 |
| `isl-studio-offline.html` | three.js 내장판(+600 KB). 오프라인·헤드리스용, 기능 동일 |

브라우저(Chrome / Edge / Firefox / Safari, WebGL)에서 파일을 열면 된다. 설치 없음.

## 구성

```
isl-studio.html            웹 프로그램 (사면 / 패턴 / 비교 탭)
isl-studio-offline.html    three.js 내장판
docs/
  ISL-Studio-Manual.docx   사용 설명서 (14쪽)
  COMPARE.md               브라우저 근사 vs OGS 참조해 비교 결과 (Phase 1 결론)
  figs/                    비교 그림 3장
  screenshots/             화면 캡처
ogs1/                      OpenGeoSys Phase 1 키트
  README.md                5일 계획·결함 기록·재현 방법
  schema/                  scenario.json 계약 v0.1 (스키마 + 예제)
  runner/                  make_case / run_case / compare / make_library / make_figures
  runner/templates/        pattern_hc.prj.tmpl (이류형 + 등방확산 안정화)
  browser/                 헤드리스 브라우저 스냅샷 생성 (Node)
  cases/                   base + 12 시나리오 라이브러리 (results.json / pattern.prj 만 포함)
manual/                    설명서 생성 스크립트 (docx-js) · 스크린샷 스크립트 (Playwright)
```

`ogs1/cases/**/fields.bin`, `*.vtu`, 로그는 용량 때문에 저장소에서 제외했다(`.gitignore`).
`ogs1/README.md`의 재현 절차대로 `run_case.py`를 돌리면 다시 생긴다(케이스당 수 분, 12개 라이브러리 약 1시간).

## 검증 요약 (Phase 1)

브라우저 근사 vs OGS ComponentTransport, 5-spot 50 m 기준 시나리오 + 12개 라이브러리:

- 수두 RMS 차 0.13 m (약 1 %)
- sweep 접촉율(추적자 > 5 %): 물리 분산 반영 후 12개 평균 −0.6 %p
- 광체 밖 추적자: 봉쇄 성립 시 ±1 %p, 봉쇄 실패(bleed −10 %) 시 브라우저가 3~5 %p 과대
- 파과 시점: 브라우저가 0~6일 늦음

상세와 결함 기록(참조해 물질수지 결함 → 이류형 + 등방확산 안정화로 해결)은 `docs/COMPARE.md`.

## 재현

```bash
pip install -r ogs1/requirements.txt          # ogs==6.5.9, meshio, numpy, jsonschema, matplotlib
python ogs1/runner/make_case.py ogs1/schema/example.pattern.json ogs1/cases/base
python ogs1/runner/run_case.py ogs1/cases/base
python ogs1/runner/compare.py ogs1/cases/base ogs1/cases/browser_disp/browser_snapshot_day270.json
```

설명서 재생성: `cd manual && node build.js` (docx 패키지 필요). 화면 캡처: `python manual/shot.py` (Playwright + Chromium).

## 참고문헌

Yuan et al. (2025), Stantec Hard Rock Miner's Handbook, SME Mining Reference Handbook, IAEA ISL 보고서 등 — 설명서 11장.

## 라이선스

미정. 공개 전에 라이선스 파일을 추가할 것.
