# 스튜디오 쪽 연동 (이미 반영됨 — isl-studio.html)

패턴 탭 좌측 "OGS 참조해" 섹션.

- **참조해 목록** — `cases/index.json`(runner/make_index.py 생성)의 12개 케이스. 고르고 "참조해 불러오기"를 누르면
  화면 설정을 그 케이스에 맞추고(교환성 품위는 최소로 내려 반응 끔) 참조해를 겹친다.
- **scenario.json** — 현재 설정(패턴·간격·규모·외곽·Q(K 제한 반영)·bleed·농도·K·경사·도메인 크기)을 계약 v0.1로 저장.
- **스냅샷** — 현재 시점의 수두·추적자 배열. `runner/compare.py` 입력.
- **파일 선택** — `results.json` + 필드 파일(`fields.v2.bin.gz` 또는 구형 `fields.bin`) 두 개를 함께. 격자·도메인 크기가 다르면 거부.
- **3D 면에 OGS 결과 표시** — 켜면 침출제·수두 모드의 3D 평면이 OGS 결과를 그린다. 브라우저 계산은 그대로 진행.
  OGS 에 없는 표시 항목(모액·침출 진행도)이나 데이터 범위 밖에서는 브라우저 결과를 그리고 상태 상자에 그 사실을 적는다.
- **참조해 비교 (우측 패널)** — 참조해가 들어오면 나타난다. 브라우저 · OGS · 차이 평면도 세 장, OGS 프레임 시각, 수두 RMS 차, 추적자 R².
  불러온 뒤 설정을 바꾸면 "참조해 시나리오와 현재 설정이 다름" 경고에 다른 항목을 나열한다.

## 필드 파일 형식
`runner/fields_io.py` 참고. v2 = gzip( head_f32[H][N] + tracer_u16[T][N] ), H 는 서로 다른 수두장 수(침출·복원이면 2, `fields_format.head_index` 가 프레임별 번호).
셀 순서 `i + j*nx` (브라우저와 동일). 시각·격자·정호 정보는 `results.json`.

## 헤드리스 (Node)
`library_browser.js`, `make_browser_snapshots.js` 는 **생성 파일**이다 — `python browser/build_headless.py` 가 `isl-studio.html` 의 Pattern 모듈을
그대로 떼어 `drivers/*.js` 와 합친다. 스튜디오 물리를 고치면 다시 만들 것. `Pattern._dbg()` 가 수두·추적자·정호 배열을 노출한다.

- `node browser/library_browser.js cases/lib_browser.json 2.0 0.2` — 12개 시나리오를 7 PV(침출 5 + 복원 2)까지 돌려 0.5 PV 마다 기록.
- `node browser/make_browser_snapshots.js cases/browser_disp 2.0 0.2 21 135 270 405 540` — 기준 시나리오 스냅샷.
