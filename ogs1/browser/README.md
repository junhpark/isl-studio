# 스튜디오 쪽 연동 (이미 반영됨 — isl-studio.html)

패턴 탭 좌측 "OGS 참조해 연동" 섹션.

- **scenario.json 내보내기** — 현재 설정(패턴·간격·규모·외곽·Q(K 제한 반영)·bleed·농도·K·경사·도메인 크기)을 계약 v0.1로 저장.
- **브라우저 스냅샷 내보내기** — 현재 시점의 수두·추적자 배열. `runner/compare.py` 입력.
- **파일 선택** — `results.json` + `fields.bin` 두 개를 함께. 격자·도메인 크기가 다르면 거부(같은 시나리오여야 비교가 성립).
- **OGS 참조해 표시** — 켜면 침출액·수두 모드가 OGS 필드를 그린다. 브라우저 계산은 그대로 진행되며
  상세 지표에 `수두 RMS 차`, `추적자 R²`, `OGS sweep 접촉율`, `OGS 광체 밖 추적자`가 뜬다.
  상단 단계 표시에 `[OGS 참조해 표시 중]` 접두어.

## fields.bin 형식
Float32, 배열 순서 `[time][field][cell]`, `field = 0: head_m, 1: tracer_frac(0~1)`, `cell = i + j*nx` (브라우저와 동일).
시각·격자·정호 정보는 `results.json`.

## 헤드리스 비교 (Node)
`Pattern._dbg()` 가 수두·추적자·정호 배열을 노출한다. `/tmp/studio/_snap.js` 참고.
