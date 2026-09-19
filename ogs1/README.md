# ISL Studio ↔ OpenGeoSys 1단계 키트 (패턴식 · 포화 · 추적자)

**목적** — 브라우저 근사 모델(ISL Studio 패턴 탭)이 참조해(OGS-6 ComponentTransport)와
얼마나 벌어지는지 숫자로 확인하고, 그 결과를 같은 화면에서 재생한다. 화학·사면·역학은 이 단계에 없다.

**4일차에 잡은 결함 (2026-09-19) — 반드시 읽을 것**
- v0 템플릿(`FullUpwind` 안정화)에서는 **회수정 절점 싱크가 물만 빼고 용질은 빼지 않았다.** 회수정 절점 농도가 주입 농도의 40~80배로 치솟고,
  도메인 내 추적자 총량이 주입 총량과 같았다(회수 0). 21일 단축 검증으로는 이걸 잡을 수 없다(파과 전이라 정상·결함이 구분 안 됨).
- 100일(파과 후) 4조합 시험 결과:

  | 형식 | 안정화 | 회수정 c/c_inj | 잔존/주입 | 판정 |
  |---|---|---|---|---|
  | 보존형 (`non_advective_form=true`) | 있음/없음 | 18~26 | 1.00 | 싱크가 용질 제거 안 함 |
  | 이류형 (기본) | `FullUpwind` | 8~12 | 1.02 | 안정화가 절점 싱크를 못 봄 (v0) |
  | 이류형 (기본) | 없음 | 0.55~0.77 | 0.70 | **맞음**, 단 진동 −0.13~+1.09 |
  | 이류형 (기본) | `IsotropicDiffusion` 0.5 | (60일) 0.32~0.45 | 무안정화와 동일 | **맞음 + 진동 −0.009** → 채택 |

- `FluxCorrectedTransport`는 이 설정에서 무시된다(무안정화와 결과 동일).
- 채택 템플릿: 이류형 + `IsotropicDiffusion`(tuning 0.5). 등방확산은 인공 분산 ≈ 0.5·Δx/2 ≈ 0.9 m 를 물리 분산(αL 2 m) 위에 더한다. 문서에 명시할 것.
- 따라서 **1일차에 기록한 "광체 밖 추적자 4배 차이"는 무효**다. 총량이 5배 부풀려진 참조해와 비교한 값이었다. 수두 RMS 0.13 m 는 유효(흐름 방정식은 영향 없음).
- 결함 케이스는 `cases/base_v0_buggy/`(FullUpwind), `cases/base_v1_nonadv_buggy/`(보존형)에 보존.
- 교훈: 참조해를 믿기 전에 **물질수지(총량 = 주입 − 회수)** 부터 검사한다. `run_case.py`가 이제 이 검사를 결과에 넣는다.

**이 키트로 확인된 것 (2026-09-18~19, 컨테이너 안에서 실행)**
- `pip install ogs==6.5.9 meshio` 만으로 OGS와 메시 도구가 설치되고 돈다.
- 기본 시나리오(5-spot, 50 m, 외곽 회수정, bleed +5 %)가 첫 실행에 수렴한다. 1일 스텝 675일 = 약 7분(1코어).
- 절점 소스 단위는 **질량유량 kg/s** 이다 (주입정 수두 +9.3 m vs 브라우저 +8.4 m로 확인).
- 최종 비교(`COMPARE.md`): 수두 RMS 0.13 m(1 %), 광체 밖 유출 분율 0.3 %p 이내 일치, sweep 은 브라우저가 2~3 %p 낮음, 파과 1~5일 늦음.
- 첫 비교에서 도메인 불일치(268 vs 288 m)를 잡았다. 스튜디오는 격자·도메인이 다른 참조해를 거부한다.

## 디렉터리
```
schema/    scenario.schema.json (계약 v0.1), example.pattern.json (브라우저 기본값)
runner/    make_case.py  시나리오 → domain.vtu + boundary/inj/prod 부분영역 + pattern.prj
           run_case.py   ogs 실행 → results.json + fields.bin (브라우저 재생용)
           compare.py    브라우저 스냅샷 vs OGS 지표 4개
           validate.py   스키마 검증
           templates/pattern_hc.prj.tmpl   OGS 프로젝트 파일 템플릿 (검증됨)
           make_library.py  12개 시나리오 배치 (--worker k/n 으로 분할)
           library_summary.py  라이브러리 비교표 → cases/LIBRARY.md
           make_figures.py  COMPARE.md 그림 3장 → figs/
cases/base/  기본 케이스 (results.json, fields.bin → 스튜디오에서 바로 불러오기)
cases/lib/   시나리오 라이브러리 12개
cases/base_v0_buggy/, base_v1_nonadv_buggy/  결함 참조해 보존 (fig3 용)
cases/browser/, browser160/  브라우저 스냅샷 (80, 160 격자)
browser/     스튜디오 연동 설명, 헤드리스 스냅샷·배치 스크립트
COMPARE.md   1단계 결과 보고 (5일차 산출물)
```

## 실행 순서
```bash
pip install -r requirements.txt
python runner/validate.py schema/example.pattern.json
python runner/make_case.py schema/example.pattern.json cases/mycase
python runner/run_case.py cases/mycase          # ogs 실행 + 후처리
python runner/compare.py cases/mycase browser_snapshot_day*.json
```
스튜디오 패턴 탭 → "OGS 참조해 연동" → `results.json`과 `fields.bin`을 함께 선택 → "OGS 참조해 표시" 켜기.
상세 지표에 수두 RMS 차·추적자 R²·OGS sweep 접촉율이 뜬다.

## 5일 계획 (1인, Claude Code)
| 일 | 할 일 | 끝났다는 기준 |
|---|---|---|
| 1 ✓ | 환경. `pip install`, `cases/base` 재실행, `compare.py`로 이 README 숫자 재현 | 수두 RMS ≈ 0.13 m 재현 |
| 2 ✓ | 스튜디오 ↔ 러너 왕복. 패턴 탭에서 시나리오 내보내기 → `make_case` → `run_case` → 스튜디오에서 불러오기 | 내가 만진 설정이 OGS 결과로 돌아와 화면에 뜸 |
| 3 ✓ | 시나리오 라이브러리 12개 (3패턴 × 2간격 × 2 bleed). 배치 스크립트 + 정적 폴더 | `cases/lib/*/results.json` 12개, 총 용량 확인 |
| 4 ✓ | 수치 조사 → 참조해 결함 발견·수정 (형식×안정화 4조합, 브라우저 격자 2배) | 위 결함 표 + `COMPARE.md` |
| 5 ✓ | 문서. 4개 지표의 브라우저–OGS 격차 표, 한계, 2단계로 넘길 항목 | `COMPARE.md` |

## 확인해야 할 지점 (실행 중 눌러볼 곳)
1. **양수정 절점 유량** — 회수정 9공에 균등 분배. 실제는 정호별 다름. 시나리오 `wells.list`에 개별 Q를 넣으면 반영됨.
2. **2D 단위두께** — 유량은 Q/B 로 나눠 넣는다. 대수층 두께를 바꾸면 자동 반영되지만 층상 구조는 없음.
3. **경계** — 바깥 절점 고정수두(지역경사). 브라우저와 같은 조건이라 비교엔 맞지만 실제 대수층 경계는 아님.
4. **복원 단계** — 이 템플릿은 침출만 돈다. 복원(주입 정지·양수 지속)은 `CurveScaled` 파라미터로 주입 유량을 시간에 따라 0으로 내리면 되는데, 주입정의 추적자 Dirichlet도 함께 풀어야 하므로 2단계로 넘김.
5. **안정화** — `FullUpwind` 는 절점 싱크와 함께 쓰면 안 된다(위 결함 표). 채택은 `IsotropicDiffusion` 0.5. 인공 분산 ≈ 0.9 m 가 더해진다.

## 하지 않는 것
화학(이온교환) · 회수율 · 사면 탭 · 실측 보정. 화면에는 "OGS 참조해 (실측 미보정)"으로 표시된다.
