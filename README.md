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

화면은 속성 패널 방식이다. 항목마다 `라벨 · 값 · 단위` 한 줄이고, 설명과 근거 문헌은 옆의 ⓘ에 마우스를 올리거나 누르면 뜬다.
값 칸에 숫자를 직접 입력할 수 있고, 스페이스바로 재생·정지한다. 처음 열면 용도와 한계를 알리는 안내 창이 한 번 뜬다.

모바일(≤900 px)에서는 좌·우 패널이 하단 **설정 / 지표 / 범례** 버튼으로 여닫는 서랍이 되고,
3D 화면은 한 손가락 드래그로 회전, 두 손가락으로 확대·축소한다.

**편집은 `isl-studio.html`에서만 한다.** 오프라인 판은 `python3 manual/build_offline.py`로 다시 만든다(three.js를 파일 안에 넣음).

## 구성

```
index.html                 안내 페이지 (GitHub Pages 진입점)
isl-studio.html            웹 프로그램 (사면 / 패턴 / 비교 탭)
isl-studio-offline.html    three.js 내장판
docs/
  ISL-Studio-Manual.docx   사용 설명서 (17쪽) — 조작·지표 읽기
  ISL-Studio-Technical-Background.docx  기술 배경서 (23쪽) — 지배방정식·수치기법·OGS 구성·검증 해석
  COMPARE.md               브라우저 근사 vs OGS 참조해 비교 결과 (Phase 1 결론)
  figs/                    비교 그림 3장 + 개념도 3장
  screenshots/             화면 캡처
ogs1/                      OpenGeoSys Phase 1 키트
  README.md                5일 계획·결함 기록·재현 방법
  schema/                  scenario.json 계약 v0.1 (스키마 + 예제)
  runner/                  make_case / run_case / fields_io / compare / make_library / make_index / make_figures
  runner/templates/        pattern_hc.prj.tmpl (이류형 + 등방확산 안정화)
  browser/                 헤드리스 브라우저 스냅샷 생성 (Node)
  cases/lib/               참조해 12개 (3 패턴 × 간격 30·50 m × bleed +5·−10 %) — 스튜디오 목록에서 바로 불러옴
  cases/index.json         스튜디오가 읽는 참조해 목록
  cases/base/              기준 케이스 (= lib/5spot_s50_bp5, 그림 스크립트용)
PUBLISHING.md              GitHub 게시·Pages 배포 절차
manual/                    설명서·기술배경서 생성 스크립트 (docx-js), 수식(eqs.py)·개념도(schematics.py) 생성, 스크린샷(Playwright)
```

OpenGeoSys 참조해 12개가 전부 저장소에 들어 있다. 패턴 탭의 **OGS 참조해** 목록에서 케이스를 고르고 **참조해 불러오기**를 누르면
화면 설정이 그 케이스로 바뀌고 OGS 해가 겹쳐진다(웹으로 열었을 때).

참조해는 압축 형식(`fields.v2.bin.gz`)으로 저장한다. 수두는 정상류라 한 번만, 추적자는 16비트 정수(오차 1.2×10⁻⁵)로 담고 gzip 한다.
12개 합계 약 5 MB (원본 float32 55 MB). 형식은 `ogs1/runner/fields_io.py` 참고. 원본 `fields.bin`, `*.vtu`, 로그는 제외했다(`.gitignore`).
`ogs1/README.md`의 재현 절차대로 `run_case.py`를 돌리면 다시 생긴다(케이스당 2~8분, 12개 라이브러리 2코어 약 40분).

## 검증 요약 (Phase 1)

브라우저 근사 vs OGS ComponentTransport, 5-spot 50 m 기준 시나리오 + 12개 라이브러리:

- 수두 RMS 차 0.12~0.35 m (수두 범위의 1~3 %)
- sweep 접촉율(추적자 > 5 %): 물리 분산 반영 후 12개 평균 −1.5 %p — 봉쇄 성립(bleed +5 %) 시 −2~−5 %p(보수적), 봉쇄 실패 시 ±1 %p
- 광체 밖 추적자: 봉쇄 성립 시 ±0.6 %p, 봉쇄 실패(bleed −10 %) 시 브라우저가 2~3 %p 과대
- 파과 시점: −3~+6일

상세와 결함 기록(참조해 물질수지 결함 → 이류형 + 등방확산 안정화로 해결, 라이브러리 도메인 불일치 정정)은 `docs/COMPARE.md`.

## 재현

```bash
pip install -r ogs1/requirements.txt          # ogs==6.5.9, meshio, numpy, jsonschema, matplotlib
python ogs1/runner/make_case.py ogs1/schema/example.pattern.json ogs1/cases/base
python ogs1/runner/run_case.py ogs1/cases/base
python ogs1/runner/compare.py ogs1/cases/base ogs1/cases/browser_disp/browser_snapshot_day270.json
```

설명서 재생성: `node manual/build.js`; 기술 배경서: `python3 manual/eqs.py && python3 manual/schematics.py && node manual/build_tech.js` (docx npm 패키지, matplotlib 필요). 화면 캡처: `python manual/shot.py` (Playwright + Chromium, 오프라인 판 기준).

## 참고문헌

Yuan et al. (2025), Stantec Hard Rock Miner's Handbook, SME Mining Reference Handbook, IAEA ISL 보고서 등 — 설명서 11장.

## 게시

GitHub 저장소 생성·푸시·Pages 배포 절차는 [PUBLISHING.md](PUBLISHING.md) 참고.
Pages 를 켜면 `index.html` 이 진입점이 되고 `https://<아이디>.github.io/<저장소>/` 로 시뮬레이터가 바로 열린다.

## 라이선스

미정. 공개 전에 라이선스 파일을 추가할 것. 제3자 구성요소: three.js (MIT, `isl-studio-offline.html` 에 내장), OpenGeoSys (BSD-3, 의존성).
