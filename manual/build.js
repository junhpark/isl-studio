const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType,
        AlignmentType, LevelFormat, PageBreak, ShadingType, BorderStyle, TableOfContents, Header, Footer, PageNumber } = require('docx');

const FONT = 'Malgun Gothic';
const path = require('path'); const ROOT = path.join(__dirname, '..');
const IMG = p => fs.readFileSync(path.join(ROOT, p.replace(/^shots\//, 'docs/screenshots/').replace(/^ogs1\/figs\//, 'docs/figs/')));
const P = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 320 }, ...o, children: [new TextRun({ text: t, font: FONT, size: 20, ...(o.run || {}) })] });
const PR = (runs, o = {}) => new Paragraph({ spacing: { after: 120, line: 320 }, ...o, children: runs.map(r => new TextRun({ font: FONT, size: 20, ...r })) });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, font: FONT })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT })] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 }, children: [new TextRun({ text: t, font: FONT })] });
const B = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, spacing: { after: 60, line: 300 }, children: [new TextRun({ text: t, font: FONT, size: 20 })] });
const BR = (runs, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, spacing: { after: 60, line: 300 }, children: runs.map(r => new TextRun({ font: FONT, size: 20, ...r })) });
let NUMI=0; const NUMSTART=()=>{NUMI++;};
const NUM = t => new Paragraph({ numbering: { reference: 'num', level: 0, instance: NUMI }, spacing: { after: 60, line: 300 }, children: [new TextRun({ text: t, font: FONT, size: 20 })] });
const IMGP = (p, w, h, cap) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new ImageRun({ type: 'png', data: IMG(p), transformation: { width: w, height: h } })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: cap, font: FONT, size: 17, color: '555555', italics: true })] })];
const CODE = t => new Paragraph({ spacing: { after: 60 }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' }, children: [new TextRun({ text: t, font: 'Consolas', size: 17 })] });
const NOTE = t => new Paragraph({ spacing: { before: 80, after: 160 }, indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'B5652E', space: 8 } }, children: [new TextRun({ text: t, font: FONT, size: 19, color: '444444' })] });

function table(header, rows, widths) {
  const W = widths; const total = W.reduce((a, b) => a + b, 0);
  const cell = (t, hd, w) => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: hd ? { type: ShadingType.CLEAR, fill: 'E8E4DC', color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ spacing: { after: 0, line: 280 }, children: [new TextRun({ text: t, font: FONT, size: 18, bold: hd })] })] });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: W,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, true, W[i])) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, false, W[i])) }))] });
}
const SP = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const body = [];
/* ── 표지 ── */
body.push(new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'ISL Studio', font: FONT, size: 64, bold: true })] }));
body.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '현장용액채광(In-Situ Leaching) 비교 시뮬레이터', font: FONT, size: 32 })] }));
body.push(new Paragraph({ spacing: { after: 800 }, children: [new TextRun({ text: '사용 설명서 · 프로토타입 v1.0 (Phase 1 완료판)', font: FONT, size: 24, color: '555555' })] }));
body.push(P('이온흡착형 중희토류 광상의 사면 중력식 침출과, 피압대수층의 정호 패턴식 침출을 같은 화면에서 비교하는 웹 프로토타입입니다. 브라우저에서 단일 HTML 파일로 실행되며, OpenGeoSys 참조해를 불러와 근사 모델과 겹쳐 볼 수 있습니다.'));
body.push(SP());
body.push(NOTE('예시용 프로토타입입니다. 거친 근사 모델이며 설계·인허가·환경영향평가의 근거로 사용할 수 없습니다. 기본값은 공개 문헌 인용치이고 특정 광산의 실측값이 아닙니다.'));
body.push(P('2026년 9월', { run: { color: '555555' } }));
body.push(new Paragraph({ children: [new PageBreak()] }));

/* ── 목차 ── */
body.push(H1('목차'));
const TOC = [['1. 개요', ['1.1 무엇을 위한 도구인가', '1.2 누구를 위한 것인가', '1.3 이 문서가 다루지 않는 것']],
  ['2. 시작하기', ['2.1 실행', '2.2 권장 환경', '2.3 첫 5분']],
  ['3. 화면 구성', ['3.1 3D 화면 조작', '3.2 재생 속도']],
  ['4. 탭 1 — 사면 중력식', ['4.1 무엇을 모사하는가', '4.2 제어', '4.3 표시 항목', '4.4 지표 읽는 법', '4.5 보여줄 만한 장면']],
  ['5. 탭 2 — 정호 패턴식', ['5.1 무엇을 모사하는가', '5.2 제어', '5.3 유선 — 봉쇄의 판정', '5.4 표시 항목', '5.5 지표 읽는 법', '5.6 보여줄 만한 장면']],
  ['6. 탭 3 — 비교', []],
  ['7. OpenGeoSys 참조해 연동', ['7.1 흐름', '7.2 물질수지 경고', '7.3 시나리오 라이브러리']],
  ['8. 이 모델이 하는 것과 하지 않는 것', []],
  ['9. 검증 결과 요약', []],
  ['10. 파일 구성과 재현', ['10.1 OGS 키트 재현', '10.2 소스 구조 (개발자용)']],
  ['11. 참고문헌', []]];
for (const [h, subs] of TOC) {
  body.push(new Paragraph({ spacing: { before: 100, after: 40 }, children: [new TextRun({ text: h, font: FONT, size: 21, bold: true })] }));
  for (const s of subs) body.push(new Paragraph({ spacing: { after: 20 }, indent: { left: 480 }, children: [new TextRun({ text: s, font: FONT, size: 19, color: '444444' })] }));
}
body.push(new Paragraph({ children: [new PageBreak()] }));

/* ── 1 개요 ── */
body.push(H1('1. 개요'));
body.push(H2('1.1 무엇을 위한 도구인가'));
body.push(P('이 도구는 두 가지 현장용액채광 방식을 나란히 놓고, 회수·유실·안전 지표가 운영 변수에 따라 어떻게 함께 움직이는지 보여줍니다.'));
body.push(BR([{ text: '사면 중력식 — ', bold: true }, { text: '이온흡착형 희토류 광상(중국 남부·미얀마·라오스)에서 쓰는 방식. 불포화 사면 상부에 황산암모늄 용액을 주입하고 하단 집액구에서 중력으로 모액을 받습니다. 압력으로 흐름을 제어할 수 없어 유출은 자연 차수층의 연속성에 달려 있습니다.' }]));
body.push(BR([{ text: '정호 패턴식 — ', bold: true }, { text: '우라늄·구리 ISR에서 쓰는 방식. 포화 피압대수층에 주입정과 회수정을 격자로 배치하고, 양수량을 주입량보다 몇 % 많게(bleed) 유지해 침출액을 수리학적으로 가둡니다.' }]));
body.push(P('핵심 메시지는 하나입니다. 두 방식의 환경 영향 차이는 시약이 아니라 수리지질에서 옵니다. 사면식은 구조적으로 봉쇄가 불가능하고, 패턴식은 봉쇄가 가능하지만 지질 조건과 상시 양수·감시 비용을 요구합니다.'));
body.push(H2('1.2 누구를 위한 것인가'));
body.push(B('정책·의사결정자: 배리어 유무, bleed 유무에 따라 유실이 어떻게 달라지는지 눈으로 확인'));
body.push(B('기술 검토자: 근사 모델의 가정과 한계, OpenGeoSys 참조해 대비 오차 범위를 확인'));
body.push(B('개발자: 물리 모듈·렌더러·OGS 연동 파이프라인의 구조를 파악해 확장'));
body.push(H2('1.3 이 문서가 다루지 않는 것'));
body.push(P('물리 모델의 지배방정식·수치기법·OpenGeoSys 구성의 상세는 함께 배포되는 「기술 배경서」(ISL-Studio-Technical-Background.docx)에, 비교 실험의 원자료와 결함 기록은 README.md와 COMPARE.md에 있습니다. 이 문서는 화면을 열어 조작하고 결과를 읽는 방법에 집중합니다.'));

/* ── 2 시작하기 ── */
body.push(H1('2. 시작하기'));
body.push(H2('2.1 실행'));
body.push(P('isl-studio.html 파일 하나를 최신 Chrome, Edge, Firefox, Safari에서 엽니다. 설치가 필요 없습니다. WebGL을 지원하는 브라우저면 됩니다.'));
body.push(P('3D 렌더링 라이브러리(three.js r128)를 CDN에서 불러오므로 처음 열 때 인터넷 연결이 필요합니다. 오프라인 환경에서는 라이브러리를 내장한 isl-studio-offline.html을 쓰십시오. 기능은 같습니다.'));
body.push(H2('2.2 권장 환경'));
body.push(B('화면 폭 1,400 px 이상. 좌측 제어 패널(268 px)과 우측 지표 패널(300 px) 사이에 3D 화면이 들어갑니다.'));
body.push(B('통합 그래픽으로도 충분합니다. 사면식은 27,000 셀, 패턴식은 6,400 셀을 매 프레임 갱신합니다.'));
body.push(B('탭 전환 시 계산 상태가 초기화되지는 않지만 재생은 멈춥니다.'));
body.push(H2('2.3 첫 5분')); NUMSTART();
body.push(NUM('사면 중력식 탭에서 재생을 누릅니다. 속도는 “보통”으로 두십시오. 침출액(시안색)이 표토를 지나 기반암 위에 고이고 사면 아래로 흐르는 것을 봅니다.'));
body.push(NUM('하단 절개 슬라이더를 왼쪽으로 옮겨 종단면을 엽니다. 층 구분과 침윤선이 보입니다.'));
body.push(NUM('좌측 “기반암 차수층 결손”을 켜고 초기화 후 다시 재생합니다. 유실률이 뛰는 것을 봅니다.'));
body.push(NUM('정호 패턴식 탭으로 가서 Bleed 슬라이더를 −10 %로 내립니다. 유선이 적색으로 바뀌며 경계 밖으로 나갑니다. +5 %로 되돌리면 사라집니다. 이 장면이 두 방식의 차이입니다.'));
body.push(NUM('비교 탭에서 “현재 설정으로 두 방식 계산”을 누릅니다.'));

/* ── 3 화면 구성 ── */
body.push(H1('3. 화면 구성'));
body.push(...IMGP('shots/02_slope_running.png', 600, 360, '그림 3-1. 전체 화면 (사면 중력식 탭, 76일차 정수 단계)'));
body.push(table(['영역', '위치', '내용'], [
  ['경고 배너', '최상단', '프로토타입임을 알리는 고정 문구'],
  ['탭', '배너 아래', '사면 중력식 / 정호 패턴식 / 비교'],
  ['제어 패널', '좌측', '주입 조건, 배리어·운전 조건, 대수층, OGS 연동. 탭마다 내용이 바뀝니다'],
  ['3D 화면', '중앙', '지질 블록과 용액 분포. 마우스 드래그 회전, 휠 확대'],
  ['표시 항목', '3D 좌상단', '어떤 물리량을 색으로 칠할지 선택'],
  ['상태 상자', '3D 우상단', '경과 시간(일 또는 PV), 현재 단계, 지금 일어나는 일의 한 줄 설명'],
  ['범례', '3D 우하단', '면(색)과 선·표식의 의미. 표시 항목·배리어 상태에 따라 갱신'],
  ['지표 패널', '우측', '대형 지표 3개, 경고, 시간 이력 차트, 상세 지표(접힘), 모델 한계(접힘)'],
  ['타임라인', '최하단', '재생/초기화, 진행 막대, 속도 3단, 절개 슬라이더'],
], [1500, 1400, 6200]));
body.push(SP());
body.push(H2('3.1 3D 화면 조작'));
body.push(B('회전: 마우스 왼쪽 버튼 드래그. 확대·축소: 휠. 사면 탭은 비스듬한 측면 시점, 패턴 탭은 위에서 내려다보는 시점이 기본입니다.'));
body.push(B('절개: 하단 슬라이더를 왼쪽으로 옮기면 블록이 잘리고 잘린 면에 종단면이 그려집니다. 100 %가 절개 없음입니다.'));
body.push(B('3D 안에는 글자가 없습니다. 무엇이 무엇인지는 우하단 범례에서 읽습니다.'));
body.push(H2('3.2 재생 속도'));
body.push(P('“느리게”는 프레임당 부분스텝 1회, “보통”은 3회, “빠르게”는 10회입니다. 사면식 120일은 느리게 약 2분, 패턴식 7 PV는 보통 약 1분입니다. 용액이 번지는 과정을 보려면 느리게, 결과만 보려면 빠르게가 맞습니다.'));

/* ── 4 사면 탭 ── */
body.push(H1('4. 탭 1 — 사면 중력식'));
body.push(H2('4.1 무엇을 모사하는가'));
body.push(P('100 × 60 m 사면 도메인을 2.5 m 격자(40 × 24 × 28 셀)로 나눕니다. 표토(1.5 m), 전풍화층(광체, 10 m), 반풍화층(6.5 m), 기반암(자연 차수층)의 4개 층이 지형을 따라 놓입니다. 투수계수는 Yuan et al. (2025) Table 1의 7.08 / 2.59 / 1.30 / 0.00038 m/d를 씁니다. 표토와 기반암 사이에 네 자릿수 차이가 있어 침출액은 표토를 순식간에 지나 기반암 위에서 멈춥니다.'));
body.push(P('시간은 일(日)입니다. 0–35일 침출(상·중·하 구역을 5일 간격 순차 주입), 35–77일 정수(頂水, 물만 주입), 77–120일 배수·모니터링.'));
body.push(H2('4.2 제어'));
body.push(table(['항목', '범위 · 기본값', '뜻'], [
  ['주입강도', '0.005–0.150 · 0.042 m/d', '주입공당 면적 주입속도. Wang et al. (2022) 시험채굴장 값'],
  ['침출제 농도', '0.05–0.50 · 0.25 mol/L', '황산암모늄. Wu et al. (2023)이 경제적이라 본 범위'],
  ['교환성 희토류 품위', '0.010–0.110 · 0.050 wt%', '이온교환으로 회수 가능한 분율만. 모나자이트 등 난용성은 제외'],
  ['집액구', '항상 켜짐', '사면 하단 기반암 경계의 모액 회수 도랑. 기본 조치'],
  ['도액공', '켜기/끄기', '집액구 상부 수평공. 포집 효율 +15 %p'],
  ['하류 차수벽', '켜기/끄기', '하단 경계 저투수 벽체. 격자 투수계수를 직접 낮춤'],
  ['양수 차단정', '켜기/끄기', '집액구 상류 회수정. 포집 효율 +8 %p'],
  ['기반암 차수층 결손', '켜기/끄기 (위험 시나리오)', '중부 사면 기반암에 고투수 창(0.6 m/d)을 넣어 자연 차수층 결손을 모사'],
], [2000, 2600, 4500]));
body.push(SP());
body.push(NOTE('품위를 바꾸면 초기 흡착량이 달라지므로 자동으로 초기화됩니다. 나머지는 재생 중에도 바꿀 수 있습니다.'));
body.push(H2('4.3 표시 항목'));
body.push(table(['항목', '색', '무엇을 보는가'], [
  ['침출액', '시안', '황산암모늄 농도. 용액이 어디까지 갔는지. 기본값'],
  ['모액', '황 → 적', '용액 중 희토류 농도. 집액구로 오는 회수 대상'],
  ['포화도', '남색', '침출액 포화도. 정체수가 어디 고이는지'],
  ['침출 진행도', '보라', '초기 흡착량 대비 얼마나 씻겼는지. 상부에 남는 미침출 구역이 회수율 한계의 이유'],
], [1600, 1400, 6100]));
body.push(SP());
body.push(...IMGP('shots/03_slope_section.png', 600, 360, '그림 4-1. 절개 종단면. 파선이 기반암 상면(자연 차수층), 밝은 청록 실선이 침윤선(포화 상단), 호박색 사각형이 집액구'));
body.push(H2('4.4 지표 읽는 법'));
body.push(BR([{ text: '회수율 — ', bold: true }, { text: '집액구로 회수된 희토류 / 초기 교환성 흡착량. 120일 기준 약 38 %. 액/고 비가 실제 조업(0.5–1.0)보다 낮은 0.16이라 낮게 나옵니다. 절대값보다 설정 간 상대 비교로 읽으십시오.' }]));
body.push(BR([{ text: '유실률 — ', bold: true }, { text: '주입량 중 회수되지 않고 도메인을 빠져나간 물의 비율. 상세 지표에서 지표 유출 / 기반암 저면 / 하류 측방 세 경로로 나뉩니다.' }]));
body.push(BR([{ text: '최소 안전율 — ', bold: true }, { text: '중앙 종단면에서 Bishop 간이법 원호 탐색. 허용치 1.1(DZ/T 0218-2006). 침출과 함께 1.6에서 1.2대로 떨어졌다가 배수 후 회복합니다. 전풍화층 강도는 침출 진행도에 따라 최대 0.70배까지 저감됩니다(Yuan et al. 2025).' }]));
body.push(BR([{ text: '물질수지 잔차 — ', bold: true }, { text: '상세 지표 맨 아래. 주입 = 회수 + 유실 + 잔류가 항상 0에 붙어 있어야 합니다. 이 값이 0에서 벗어나면 모델이 아니라 버그입니다.' }]));
body.push(H2('4.5 보여줄 만한 장면'));
body.push(B('주입강도를 0.042에서 0.12 m/d로 올리면 회수율은 오히려 떨어지고(38 → 27 %), 유실 12 %, 안전율 0.77. 과잉 주입은 회수에 기여하지 않으면서 환경부하와 사면위험만 키운다는 Wu et al.·Nugroho의 결론이 재현됩니다.'));
body.push(B('기반암 결손을 켜면 저면 누출이 21 %로 뜁니다. 자연 차수층 하나에 의존하는 방식의 취약성입니다.'));
body.push(B('배리어를 전부 켜도 회수율은 38 → 40 %입니다. 사면식에서는 배리어가 봉쇄를 만들지 못하고 포집을 조금 돕는 데 그칩니다.'));

/* ── 5 패턴 탭 ── */
body.push(H1('5. 탭 2 — 정호 패턴식'));
body.push(H2('5.1 무엇을 모사하는가'));
body.push(P('두께 8 m의 포화 피압대수층을 80 × 80 평면 격자로 풉니다. 수두는 정호 조건이 바뀔 때만 Laplace 방정식을 다시 풀고(SOR), 그 속도장으로 침출액과 회수 대상을 이류·분산시킵니다. 위아래 차수층은 흐름에 참여하지 않습니다. 도메인 크기는 정호군 크기에 맞춰 자동으로 정해집니다(기본 288 m).'));
body.push(P('시간은 일이 아니라 누적 양수 공극체적(PV)입니다. 우라늄 ISR 실무 단위이고, 정호 간격이 달라도 같은 기준으로 비교할 수 있습니다. 0–5 PV 침출, 5–7 PV 복원(주입 정지, 양수 지속).'));
body.push(...IMGP('shots/05_pattern_running.png', 600, 360, '그림 5-1. 기본 설정(5-spot, 50 m, 외곽 회수정, bleed +5 %) 침출 중. 유선이 모두 청록(포집)'));
body.push(H2('5.2 제어'));
body.push(table(['항목', '범위 · 기본값', '뜻'], [
  ['패턴', '5-spot / 7-spot / Line drive', '정호 배치 규칙'],
  ['정호 간격', '20–80 · 50 m', '1급 변수. SME 핸드북 15–61 m, Honeymoon(2026) 50–60 m 시험'],
  ['패턴 규모', '1×1 – 3×3 · 2×2', '패턴 반복 수'],
  ['외곽 정호 = 회수정', '켜기 · 기본 켜짐', '켜면 회수정이 바깥을 둘러쌈(Florence Copper 방식, 주입 4 : 회수 9). 끄면 주입정이 바깥'],
  ['주입량 / 정호', '30–300 · 100 m³/d', '투수계수가 낮으면 허용 수위강하(15 m) 안에서 자동 제한됨'],
  ['Bleed (양수 − 주입)', '−15 – +15 · +5 %', '양수가 주입보다 많으면 안쪽으로 동수경사가 생겨 침출액이 갇힘. 음수면 밖으로 밀려남. IAEA NF-T-1.4: 수 %'],
  ['침출제 농도', '0.05–0.50 · 0.25 mol/L', ''],
  ['교환성 품위', '0.010–0.110 · 0.050 wt%', ''],
  ['투수계수', '0.05–5 · 1.0 m/d (로그)', 'IAEA 경험칙: 1 m/d 이상 유리, 0.1 m/d 이하 불가'],
  ['지역 동수경사', '0–0.020 · 0.002', '배경 지하수 흐름(+x 방향). 크면 하류로 밀림'],
  ['종분산도 αL (목표)', '0–5 · 2.0 m', '물리 분산. 브라우저는 격자 수치분산(Δx/2)을 빼고 적용. OGS와 같은 값을 공유'],
  ['횡분산도 αT', '0–1 · 0.2 m', ''],
  ['이온흡착형 풍화토 가정 [가설]', '켜기/끄기', '투수계수를 0.16 m/d로. 사면형 광상은 불포화·비폐색이라 본래 대상이 아님. 포화대 평탄 광상 사례 미확보'],
], [2300, 2400, 4400]));
body.push(SP());
body.push(H2('5.3 유선 — 봉쇄의 판정'));
body.push(P('주입정마다 12개 유선을 속도장에서 추적합니다. 색이 곧 판정입니다.'));
body.push(BR([{ text: '청록 — ', bold: true }, { text: '회수정에 도달. 포집됨.' }]));
body.push(BR([{ text: '적색 — ', bold: true }, { text: '도메인 경계 밖으로 이탈. 봉쇄 실패.' }]));
body.push(BR([{ text: '회색 — ', bold: true }, { text: '속도가 0에 가까운 정체점에서 멈춤.' }]));
body.push(...IMGP('shots/07_pattern_bleed_neg.png', 600, 360, '그림 5-2. Bleed −10 %. 주입이 양수를 초과하자 유선 17 %가 적색으로 바뀌며 밖으로 나간다. 상태 상자와 경고가 이를 알린다'));
body.push(P('실선 사각형은 광체 범위(회수율의 분모), 점선 사각형은 감시정 링입니다. 감시정 12공은 회색 원기둥이고, 추적자가 관리치(주입 농도의 3 %)를 2회 연속 넘으면 적색으로 바뀝니다. 실제 규정(미국 NRC)은 염화물·전기전도도·총알칼리도 중 2개 지시항목의 동시 초과를 excursion으로 정의합니다. 여기서는 추적자 하나로 대체했습니다.'));
body.push(H2('5.4 표시 항목'));
body.push(table(['항목', '무엇을 보는가'], [
  ['침출액', '추적자 농도. 플룸이 어디까지 갔는지. 기본값'],
  ['모액', '용액 중 회수 대상 농도'],
  ['침출 진행도', 'sweep. 정호 사이에 침출액이 닿지 않는 꽃잎 모양 정체 구역이 남는 것이 회수 한계의 이유'],
  ['수두', '압력면. 등고선과 함께. 주입정에서 솟고 회수정에서 꺼짐'],
], [2200, 6900]));
body.push(SP());
body.push(...IMGP('shots/06_pattern_section.png', 600, 360, '그림 5-3. 절개 종단면. 두 차수층 사이의 대수층, 그 구간에만 걸린 정호 스크린, 대수층 위에 그린 수두면'));
body.push(H2('5.5 지표 읽는 법'));
body.push(BR([{ text: '회수율 — ', bold: true }, { text: '회수정으로 회수된 대상 / 초기 흡착량. 기본 설정 7 PV에 약 90 %.' }]));
body.push(BR([{ text: '유실률 — ', bold: true }, { text: '현재 도메인 내 침출액 중 광체 범위 밖에 있는 비율. 복원 양수로 되끌려오면 줄어듭니다. 상세 지표의 “유실률 최대(침출 중)”가 조업 중 최악값입니다.' }]));
body.push(BR([{ text: '감시정 초과 — ', bold: true }, { text: '12공 중 알람 상태인 수.' }]));
body.push(BR([{ text: '1 PV 소요 — ', bold: true }, { text: '상세 지표. 투수계수를 낮추면 정호당 주입량이 제한되어 이 값이 급격히 늘어납니다. 이온흡착형 가정(0.16 m/d)에서 135 → 695일.' }]));
body.push(H2('5.6 보여줄 만한 장면'));
body.push(B('Bleed +5 → 0 → −10 %. 유선 이탈 0 → 4 → 17 %. 봉쇄가 수리학적으로 만들어지고 깨지는 과정.'));
body.push(B('외곽 정호를 주입정으로 바꾸고 bleed를 음수로. 이탈 23 %. 회수정이 바깥에 있어야 하는 이유.'));
body.push(B('간격 30 → 70 m. 1 PV가 49 → 265일. 정호 수는 같은데 체류시간이 5배. Honeymoon이 광역 간격으로 간 논리.'));
body.push(B('이온흡착형 가정 켜기. 정호당 주입 100 → 19 m³/d, 1 PV 695일. 같은 기간을 맞추려면 정호를 5배 촘촘히 박아야 합니다. 이 방식이 이온흡착형에 맞지 않는 이유가 숫자로 나옵니다.'));

/* ── 6 비교 탭 ── */
body.push(H1('6. 탭 3 — 비교'));
body.push(P('“현재 설정으로 두 방식 계산”을 누르면 두 탭에서 조정한 설정 그대로 두 모델을 끝까지 돌려(사면 120일, 패턴 7 PV) 나란히 놓습니다. 수 초 걸립니다.'));
body.push(...IMGP('shots/10_compare.png', 600, 380, '그림 6-1. 비교 탭'));
body.push(P('표 아래 소견은 자동 생성됩니다. 봉쇄 여부, 그 대가(정호 수·상시 양수·감시정·복원), 지질 조건(이온흡착형 가정 시 정호 밀도), 그리고 한 문장 결론.'));
body.push(NOTE('시간축과 면적이 다릅니다(사면 6,000 m² · 120일, 패턴 22,500 m² · 7 PV). 절대값이 아니라 비율과 방향으로 읽으십시오. 패턴식의 시약은 순환 총량이라 실제 소비보다 훨씬 큽니다.'));

/* ── 7 OGS ── */
body.push(H1('7. OpenGeoSys 참조해 연동'));
body.push(P('패턴 탭 좌측 맨 아래 “OGS 참조해 연동” 섹션입니다. 브라우저 근사 모델이 얼마나 정확한지를 오픈소스 유한요소 코드(OpenGeoSys 6.5.9)의 결과와 같은 화면에서 비교합니다.'));
body.push(H2('7.1 흐름')); NUMSTART();
body.push(NUM('패턴 탭에서 설정을 정하고 “scenario.json 내보내기”를 누릅니다. 격자, 대수층, 정호 좌표·유량, 분산도, 농도, 일정이 계약 v0.1 형식으로 저장됩니다.'));
body.push(NUM('키트(ogs-phase1-kit.zip)의 runner/make_case.py에 그 파일을 넣어 OGS 케이스를 만들고, runner/run_case.py로 실행·후처리합니다. 기본 시나리오 675일이 1코어 약 7분입니다.'));
body.push(NUM('나온 results.json과 fields.bin 두 파일을 “파일 선택”에서 함께 고릅니다. 격자 크기나 도메인이 다르면 거부됩니다. 같은 시나리오여야 비교가 성립하기 때문입니다.'));
body.push(NUM('“OGS 참조해 표시”를 켭니다. 침출액·수두 모드가 OGS 결과를 그리고, 브라우저 계산은 그대로 진행되어 상세 지표에 수두 RMS 차, 추적자 R², OGS sweep 접촉율이 뜹니다. 상단 단계 표시에 [OGS 참조해 표시 중]이 붙습니다.'));
body.push(H2('7.2 물질수지 경고'));
body.push(P('참조해를 불러올 때 도메인 잔존/누적 주입 비와 회수정 최대 농도를 검사합니다. 파과 후 잔존비가 0.95를 넘거나 회수정 농도가 주입 농도의 1.2배를 넘으면 경고가 뜹니다. 회수정이 물만 빼고 용질을 빼지 않는 결함(OGS의 FullUpwind 안정화 또는 보존형 이송방정식과 절점 싱크의 조합)이 있을 때 나타나는 증상입니다. Phase 1에서 실제로 겪었고, 그 기록이 COMPARE.md에 있습니다.'));
body.push(...IMGP('ogs1/figs/fig3_mass_balance.png', 560, 288, '그림 7-1. 결함 참조해 두 개(회색 파선)는 잔존비 1.0에 붙어 있고, 수정된 참조해(주황)와 브라우저(파랑)는 함께 내려간다'));
body.push(H2('7.3 시나리오 라이브러리'));
body.push(P('ogs-phase1-lib.zip에 3 패턴 × 2 간격(30, 50 m) × 2 bleed(+5, −10 %) = 12개 케이스의 참조해가 들어 있습니다. 패턴 탭에서 같은 설정을 맞춘 뒤 해당 폴더의 두 파일을 불러오면 됩니다. 용량 때문에 프레임을 10일 간격으로 솎았습니다.'));

/* ── 8 한계 ── */
body.push(H1('8. 이 모델이 하는 것과 하지 않는 것'));
body.push(P('우측 패널의 “이 모델이 하지 않는 것”을 펼치면 탭별 목록이 나옵니다. 요약하면 다음과 같습니다.'));
body.push(table(['영역', '하는 것', '하지 않는 것'], [
  ['화학', '이온교환을 1차 속도식 + 포화항으로', 'Kerr/Gapon 선택계수, 활동도, 음이온 차폐, 우라늄 산화·탄산염 화학'],
  ['불포화 흐름 (사면)', '중력 지배 배수 근사, 포화 셀 측방류', 'Richards 방정식, 모관 흡수'],
  ['포화 흐름 (패턴)', '2D 정류 Laplace, 정호 소스/싱크', '연직 sweep, 층상 불균질, 비정류'],
  ['분산', '패턴 탭: 면 속도 기반 대각 텐서', '교차항, 사면 탭의 물리 분산'],
  ['투수계수', '층별 상수', '점토 팽윤·신생 점토·석고 침전에 의한 변화'],
  ['사면 안정', '중앙 단면 Bishop 간이법, 침출 진행도 연동 강도 저감', '3차원 효과, 인장균열, 지진하중'],
  ['excursion', '추적자 1개, 2회 연속 초과', '규정의 지시항목 2개 동시 초과'],
  ['복원', '지하수 스윕만', '역삼투 재주입, 환원 재순환'],
  ['스케일', '단일 채굴장 (100 m급)', '광역 영향의 면적 환산'],
  ['검증', 'OGS 참조해 대비 (패턴 탭)', '실측 보정. 참조해도 가정 위에 있음'],
], [1900, 3400, 3800]));
body.push(SP());

/* ── 9 검증 ── */
body.push(H1('9. 검증 결과 요약'));
body.push(P('패턴 탭을 OpenGeoSys 참조해와 12개 시나리오에서 비교했습니다. 상세는 COMPARE.md에 있습니다.'));
body.push(table(['지표', '브라우저 − OGS', '해석'], [
  ['수두 RMS', '0.13 m (범위의 1 %)', '흐름 풀이는 참조해와 같다'],
  ['sweep 접촉율', '±1 %p (분산항 도입 후)', '회수 한계 논의에 그대로 사용 가능'],
  ['광체 밖 유출, 봉쇄 유지', '±1 %p', '중앙값으로 읽는다'],
  ['광체 밖 유출, 봉쇄 실패', '브라우저 +3~5 %p', '그때만 상한으로 읽는다'],
  ['파과 시각', '브라우저 0~6일 늦음', '운영 일정에는 무시 가능'],
], [2400, 2600, 4100]));
body.push(SP());
body.push(...IMGP('ogs1/figs/fig1_tracer_fields.png', 600, 200, '그림 9-1. 270일 추적자 필드. 브라우저(좌), OGS(중), 차이(우). 차이는 플룸 가장자리 얇은 띠뿐'));
body.push(P('사면 탭은 참조해가 없습니다. 문헌(Yuan et al. 2025)의 안전율 추이(1.79 → 1.30 → 회복)와 침윤선 상승, Wu et al.·Nugroho의 “과잉 주입은 회수에 기여하지 않는다”를 정성적으로 재현하는 수준입니다.'));

/* ── 10 파일 ── */
body.push(H1('10. 파일 구성과 재현'));
body.push(table(['파일', '내용'], [
  ['isl-studio.html', '웹 프로그램 본체. 단일 파일. CDN에서 three.js 로드'],
  ['isl-studio-offline.html', '같은 프로그램, three.js 내장 (0.7 MB)'],
  ['ogs-phase1-kit.zip', 'OGS 연동 키트: 스키마, 러너 스크립트, prj 템플릿, 기본 케이스, README, COMPARE.md, 그림'],
  ['ogs-phase1-lib.zip', '시나리오 라이브러리 12개 참조해'],
  ['COMPARE.md', '검증 결과 보고. 참조해 결함 기록 포함'],
  ['MANUAL.docx', '이 문서'],
], [2600, 6500]));
body.push(SP());
body.push(H2('10.1 OGS 키트 재현'));
body.push(CODE('pip install -r requirements.txt            # ogs==6.5.9, meshio, numpy, jsonschema'));
body.push(CODE('python runner/make_case.py schema/example.pattern.json cases/base'));
body.push(CODE('python runner/run_case.py cases/base       # OGS 실행 + results.json / fields.bin'));
body.push(CODE('node browser/make_browser_snapshots.js cases/browser 2.0 0.2 21 135 270 405 540'));
body.push(CODE('python runner/compare.py cases/base cases/browser/browser_snapshot_day*.json'));
body.push(CODE('python runner/make_library.py                # 12 케이스, 1코어 약 60분'));
body.push(H2('10.2 소스 구조 (개발자용)'));
body.push(P('isl-studio.html의 스크립트는 네 부분입니다. 공통 유틸(색 스케일, 차트, DOM 빌더, 카메라), Slope 모듈, Pattern 모듈, 셸(탭·렌더러·타임라인·비교). 두 물리 모듈은 같은 인터페이스(reset / advance / tick / drawSection / ui / batch)로 셸에 물리고, THREE나 DOM 없이도 돌아가도록 분리되어 있어 Node에서 헤드리스로 실행됩니다. 참조해 재생 모듈을 붙이거나 물리 모듈을 Python으로 바꿀 때 이 경계를 유지하십시오.'));

/* ── 11 참고문헌 ── */
body.push(H1('11. 참고문헌'));
[
  'Yuan et al. (2025). Applied Sciences 15, 6677. 이온흡착형 희토류 사면의 침출 중 침투–안정 해석. 투수계수·강도 저감 계수의 출처.',
  'Wang et al. (2022). Minerals 12, 1500. 시험채굴장 3D 침투–이송 모델. 주입강도 0.0417 m/d, 이온상 품위 범위.',
  'Wu et al. (2023). Adsorption Science & Technology. NMRI 기반 메조스코픽 침출 모사. 우세유로, 컬럼 파과곡선, 경제적 농도 범위.',
  'Cunningham et al. (2025). Scientific Reports 15. 남미 이온흡착형 광상 특성화. Y·중희토의 98 %가 점토·운모에, Ce의 94 %가 모나자이트에 부존.',
  'Nugroho, R. T. (2026). KAUST MSc Thesis. 우라늄 ISL 반응이송 모델과 민감도. 주입률 민감도 계수 음수.',
  'IAEA (2016). Nuclear Energy Series NF-T-1.4. ISL 우라늄 채광 개요. 성립 6조건, 투수계수 경험칙, bleed.',
  'IAEA (1989). TECDOC-492. ISL 우라늄의 기술·환경·경제.',
  'SME (2020). Mining Reference Handbook, 2nd ed., Ch. 19 In Situ Leaching. 정호 간격, 5-spot 유량식.',
  'Haschke et al. (2016). Procedia Engineering. ISR 폐색 기작.',
  'Hatch / Aclara (2026). Carina REE Project NI 43-101 Feasibility Study. Condition A 탈착 시험, 원소별 탈착률.',
  'Boss Energy (2026). Honeymoon Feasibility Study. 광역 간격 5-spot, EKT1 60 m / EKT2 50 m 시험.',
  'Taseko Mines (2023). Florence Copper NI 43-101. PTF 주입 4 · 회수 9 · 관측 7 · 다층 4공, 수리학적 봉쇄 입증.',
  'U.S. NRC (2015, 2026). ISR excursion 정의와 지시항목.',
  'Centre for Information Resilience (2025). Uncovered: Myanmar’s rare earth mining boom. Pang War 위성 분석.',
  'Zhang, L. et al. (2024). Hydrometallurgy 227, 106357. 모의 현장침출 중 공극구조·투수계수 변화.',
  'Zhang, Z. Y. et al. (2016). Hydrometallurgy 164, 248–256. 층별 교환성 희토류·알루미늄 분포와 주입 기술.',
].forEach(t => body.push(B(t)));

const doc = new Document({
  creator: 'ISL Studio', title: 'ISL Studio 사용 설명서',
  styles: { default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: FONT, color: '1A1207' }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: FONT, color: 'B5652E' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, font: FONT }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } }] },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 300 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] }] },
  sections: [{ properties: { page: { margin: { top: 1300, bottom: 1200, left: 1300, right: 1300 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'ISL Studio 사용 설명서 · 프로토타입 v1.0', font: FONT, size: 16, color: '888888' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '888888' })] })] }) },
    children: body }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(path.join(ROOT,'docs','ISL-Studio-Manual.docx'), b); console.log('docx written', b.length); });
