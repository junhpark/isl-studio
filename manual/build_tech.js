/* ISL Studio 기술 배경서 (지배방정식·이론·수치기법·OpenGeoSys) → docs/ISL-Studio-Technical-Background.docx
   node manual/build_tech.js   (먼저 python3 manual/eqs.py, python3 manual/schematics.py) */
const fs = require('fs'), path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType,
        AlignmentType, LevelFormat, PageBreak, ShadingType, BorderStyle, Header, Footer, PageNumber } = require('docx');

const ROOT = path.join(__dirname, '..');
const FONT = 'Malgun Gothic';
const IMG = p => fs.readFileSync(path.join(ROOT, p));
const EQM = JSON.parse(fs.readFileSync(path.join(__dirname, 'eq', 'manifest.json')));

const P = (t, o = {}) => new Paragraph({ spacing: { after: 120, line: 330 }, ...o, children: [new TextRun({ text: t, font: FONT, size: 20, ...(o.run || {}) })] });
const PR = (runs, o = {}) => new Paragraph({ spacing: { after: 120, line: 330 }, ...o, children: runs.map(r => new TextRun({ font: FONT, size: 20, ...r })) });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 }, children: [new TextRun({ text: t, font: FONT })] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 120 }, children: [new TextRun({ text: t, font: FONT })] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, font: FONT })] });
const B = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, spacing: { after: 60, line: 310 }, children: [new TextRun({ text: t, font: FONT, size: 20 })] });
const BR = (runs, lvl = 0) => new Paragraph({ numbering: { reference: 'bul', level: lvl }, spacing: { after: 60, line: 310 }, children: runs.map(r => new TextRun({ font: FONT, size: 20, ...r })) });
let NUMI = 0; const NUMSTART = () => { NUMI++; };
const NUM = t => new Paragraph({ numbering: { reference: 'num', level: 0, instance: NUMI }, spacing: { after: 60, line: 310 }, children: [new TextRun({ text: t, font: FONT, size: 20 })] });
const CODE = t => new Paragraph({ spacing: { after: 40, line: 260 }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' }, indent: { left: 200 }, children: [new TextRun({ text: t, font: 'Consolas', size: 16 })] });
const NOTE = t => new Paragraph({ spacing: { before: 80, after: 160 }, indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'B5652E', space: 8 } }, children: [new TextRun({ text: t, font: FONT, size: 19, color: '444444' })] });
const SP = () => new Paragraph({ spacing: { after: 100 }, children: [] });
const IMGP = (p, w, h, cap) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new ImageRun({ type: 'png', data: IMG(p), transformation: { width: w, height: h } })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: cap, font: FONT, size: 17, color: '555555', italics: true })] })];
let EQN = 0;
const EQ = (name, cap) => {
  const m = EQM[name]; let w = m.w / 300 * 72 * 1.12, h = m.h / 300 * 72 * 1.12; const MAXW = 430;
  if (w > MAXW) { h *= MAXW / w; w = MAXW; }
  EQN++;
  const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 40 },
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(__dirname, 'eq', name + '.png')), transformation: { width: Math.round(w), height: Math.round(h) } })] })];
  if (cap) out.push(new Paragraph({ spacing: { after: 140 }, indent: { left: 360 }, children: [new TextRun({ text: cap, font: FONT, size: 18, color: '444444' })] }));
  return out;
};
function table(header, rows, widths, fs_ = 17) {
  const W = widths; const total = W.reduce((a, b) => a + b, 0);
  const cell = (t, hd, w) => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: hd ? { type: ShadingType.CLEAR, fill: 'E8E4DC', color: 'auto' } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 }, children: [new Paragraph({ spacing: { after: 0, line: 270 }, children: [new TextRun({ text: t, font: FONT, size: fs_, bold: hd })] })] });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: W,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, true, W[i])) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, false, W[i])) }))] });
}
const TW = 9000;

const body = [];
/* ───────────── 표지 ───────────── */
body.push(new Paragraph({ spacing: { before: 2200, after: 200 }, children: [new TextRun({ text: 'ISL Studio', font: FONT, size: 64, bold: true })] }));
body.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '기술 배경서 — 지배방정식, 수치기법, OpenGeoSys 참조해', font: FONT, size: 32 })] }));
body.push(new Paragraph({ spacing: { after: 700 }, children: [new TextRun({ text: '현장용액채광 비교 시뮬레이터가 무엇을 어떻게 모사하는가 · v1.0', font: FONT, size: 24, color: '555555' })] }));
body.push(P('이 문서는 ISL Studio(사면 중력식 · 정호 패턴식 현장용액채광 비교 프로토타입)의 화면 뒤에 있는 물리와 수치기법을 설명합니다. 함께 배포되는 「사용 설명서」가 “어떻게 조작하는가”를 다룬다면, 이 문서는 “왜 그렇게 움직이는가”와 “어디까지 믿을 수 있는가”를 다룹니다. 공학 배경은 있으나 수리지질·용질이동·수치해석이 전공이 아닌 기술자를 독자로 상정했습니다.'));
body.push(SP());
body.push(NOTE('모든 식과 수치는 소스 코드(isl-studio.html, ogs1/)에 실제로 구현된 것을 그대로 옮긴 것입니다. 교과서의 일반식과 프로토타입의 단순화식을 구분해 적었으므로, “교과서에는 이런데 왜 여기서는 이렇게 했는가”가 곧 이 모델의 한계 목록입니다.'));
body.push(P('2026년 9월', { run: { color: '555555' } }));
body.push(new Paragraph({ children: [new PageBreak()] }));

/* ───────────── 목차 ───────────── */
body.push(H1('목차'));
const TOC = [
  ['1. 이 문서를 읽는 법', ['1.1 독자와 범위', '1.2 두 문서의 관계', '1.3 기호와 단위 관례']],
  ['2. 현장용액채광의 두 계보', ['2.1 정호 패턴식 ISR — 우라늄·구리의 방식', '2.2 사면 중력식 — 이온흡착형 희토류의 방식', '2.3 왜 같은 화면에 놓는가']],
  ['3. 공통 이론 배경', ['3.1 다공질 매체와 Darcy 법칙', '3.2 피압대수층의 흐름 방정식과 Thiem 식', '3.3 불포화 흐름 — Richards 식과 그 단순화', '3.4 용질 이동 — 이류·분산 방정식', '3.5 이온교환 침출 화학과 반응 속도식', '3.6 사면 안정 — 한계평형과 Bishop 간이법']],
  ['4. 사면 중력식 모듈의 수치 모델', ['4.1 격자와 지질 모형', '4.2 주입 스케줄과 운영 단계', '4.3 연직 배수 알고리즘', '4.4 측방 흐름과 유출 경로', '4.5 집액구·유도공·차수벽·펌프백', '4.6 침출 반응의 이산화', '4.7 안정성 계산의 구현', '4.8 지표의 정의와 물질수지']],
  ['5. 정호 패턴식 모듈의 수치 모델', ['5.1 개념 모델과 가정', '5.2 정호 배치 생성', '5.3 수두 해 — 유한차분과 SOR', '5.4 속도장과 유선 추적', '5.5 용질 이동 — 풍상 유한체적과 명시적 분산', '5.6 수치분산과 유효 분산도 보정', '5.7 침출 반응·회수·복원', '5.8 감시 링과 UCL 규칙', '5.9 지표의 정의']],
  ['6. OpenGeoSys 참조해', ['6.1 OpenGeoSys란', '6.2 사용한 구성요소와 라이브러리', '6.3 ComponentTransport 프로세스의 지배방정식', '6.4 공간·시간 이산화와 해법', '6.5 경계조건·소스항·단위 환산', '6.6 수치 안정화 옵션과 4일차 결함', '6.7 프로젝트 파일(prj) 해부', '6.8 파이프라인 — scenario.json에서 화면까지']],
  ['7. 두 모델의 대응 관계', []],
  ['8. 검증 결과의 해석', ['8.1 지표 정의', '8.2 기준 시나리오 결과', '8.3 12개 시나리오 라이브러리', '8.4 차이의 원인 분석']],
  ['9. 한계와 확장 경로', []],
  ['10. 학습 가이드 — 프로그램으로 확인해 보는 연습', []],
  ['11. 기호표', []],
  ['12. 참고문헌', []]];
for (const [h, subs] of TOC) {
  body.push(new Paragraph({ spacing: { before: 90, after: 30 }, children: [new TextRun({ text: h, font: FONT, size: 21, bold: true })] }));
  for (const s of subs) body.push(new Paragraph({ spacing: { after: 10 }, indent: { left: 480 }, children: [new TextRun({ text: s, font: FONT, size: 19, color: '444444' })] }));
}
body.push(new Paragraph({ children: [new PageBreak()] }));

/* ───────────── 1 ───────────── */
body.push(H1('1. 이 문서를 읽는 법'));
body.push(H2('1.1 독자와 범위'));
body.push(P('독자는 공학 학부 수준의 미적분·유체역학·수치해석 기초를 가진 기술자로 상정합니다. 지하수 수리학, 반응성 용질이동, 유한요소법을 처음 접하더라도 3장을 읽으면 4~6장의 식을 따라갈 수 있도록 썼습니다. 이미 익숙한 독자는 3장을 건너뛰고 4장부터 읽어도 됩니다.'));
body.push(P('범위는 ISL Studio v1.0(Phase 1 완료판)에 실제 구현된 것에 한합니다. 즉 (1) 사면 중력식 탭의 3차원 불포화 배수·침출·안정 모델, (2) 정호 패턴식 탭의 2차원 피압대수층 흐름·이동·봉쇄 모델, (3) 패턴식 탭의 추적자 문제를 OpenGeoSys로 다시 푼 참조해와 그 비교입니다. 구현되지 않은 것(다상 화학, 3차원 비균질 대수층, 사면 탭의 참조해 등)은 9장에서 한계로 정리합니다.'));
body.push(H2('1.2 두 문서의 관계'));
body.push(table(['문서', '질문', '독자'], [
  ['사용 설명서 (ISL-Studio-Manual.docx)', '어떻게 실행하고, 무엇을 누르고, 지표를 어떻게 읽는가', '시연·검토·정책 담당자'],
  ['기술 배경서 (이 문서)', '어떤 방정식을 어떻게 풀어서 그 화면이 나오는가, 참조해와 얼마나 다른가', '학습자·기술 검토자·확장 개발자'],
  ['COMPARE.md / ogs1/README.md', '비교 실험의 원자료, 결함 기록, 재현 절차', '재현·확장 개발자']], [3000, 3800, 2200]));
body.push(SP());
body.push(H2('1.3 기호와 단위 관례'));
body.push(P('브라우저 모델은 길이 m, 시간 일(d), 농도 mol/m³를 씁니다. OpenGeoSys는 SI(m, s, kg, Pa)를 쓰므로 6.5절에 환산표를 두었습니다. 굵은 기호는 벡터·텐서, 아래첨자 c는 격자 셀, f는 셀 면(face), n은 시간 단계입니다. 전체 기호는 11장에 모았습니다. 식 번호는 문서 전체에서 순번입니다.'));

/* ───────────── 2 ───────────── */
body.push(H1('2. 현장용액채광의 두 계보'));
body.push(P('현장용액채광(In-Situ Leaching, ISL; 미국식 표현으로 In-Situ Recovery, ISR)은 광석을 캐내지 않고 지하에 둔 채 용액을 흘려 금속만 녹여 회수하는 방법입니다. 갱도·노천채굴·선광·광미댐이 없어 지표 교란과 비용이 적지만, 용액이 어디로 가는지를 지질과 수리학에 전적으로 의존한다는 점이 모든 장단점의 출발점입니다. 이 프로토타입이 나란히 놓는 두 방식은 같은 이름을 쓰지만 흐름의 물리가 정반대입니다.'));
body.push(H2('2.1 정호 패턴식 ISR — 우라늄·구리의 방식'));
body.push(P('1960년대 미국 텍사스·와이오밍의 사암형 우라늄 광상에서 상용화되었고, 현재 세계 우라늄 생산의 절반 이상이 이 방식입니다(카자흐스탄·우즈베키스탄이 대표). 구리에서는 애리조나 San Manuel, Florence 등이 사례입니다. 광체가 포화 피압대수층 안에 있고 상하부에 불투수층(aquitard)이 있는 것이 전제입니다. 주입정(injection well)과 회수정(production well)을 5-spot, 7-spot, 선형(line drive) 격자로 배치하고, 주입한 침출액이 대수층을 가로질러 회수정으로 끌려오게 합니다.'));
body.push(P('핵심 운영 변수는 bleed(과잉 양수)입니다. 회수량을 주입량보다 몇 % 많게 유지하면 정호 패턴 주변에 안쪽으로 향하는 수두 경사가 생기고, 침출액은 밖으로 나갈 수 없습니다. 이것을 수리학적 봉쇄(hydraulic containment)라 하며, 패턴 밖 감시정(monitoring well)의 농도가 상한관리기준(Upper Control Limit, UCL)을 넘으면 즉시 운영을 조정하는 규제 체계가 결합됩니다. 채광이 끝나면 주입을 멈추고 양수만 계속해 대수층을 원래 수질에 가깝게 되돌리는 복원(restoration) 단계가 뒤따릅니다.'));
body.push(H2('2.2 사면 중력식 — 이온흡착형 희토류의 방식'));
body.push(P('이온흡착형 희토류 광상(ion-adsorption REE deposit; “남중국형”)은 화강암류가 열대·아열대 기후에서 깊게 풍화되어 생긴 규석토(regolith)에서, 희토류 이온이 카올리나이트·할로이사이트 같은 점토광물 표면에 교환성 양이온으로 흡착된 채 남아 있는 광상입니다. 품위는 0.05~0.3 % REO로 낮지만 중희토류(Y, Dy, Tb 등) 비율이 높고, 광물을 부수거나 태울 필요 없이 묽은 염 용액으로 “씻어내면” 되기 때문에 세계 중희토류 공급의 대부분을 담당합니다. 중국 장시성 룽난(龍南) 일대에서 1969년 발견되었고, 2000년대 이후 노천 침출과 힙 침출이 환경 문제로 금지되면서 현장 침출(in-situ leaching)이 표준이 되었으며, 2010년대 후반부터는 미얀마 카친주, 라오스로 생산이 이동했습니다.'));
body.push(P('이 방식은 포화대가 아니라 불포화 사면에서 이루어집니다. 사면 상부에 얕은 주입공을 촘촘히 뚫어 황산암모늄 용액을 넣으면 용액은 중력으로 풍화층을 통과해 내려가다가 기반암(불투수층) 위에 고이고, 사면 아래쪽으로 흘러 하단의 집액구(collection trench)·집액 갱도로 모입니다. 압력으로 흐름을 제어할 수단이 없으므로, 침출액이 어디로 가는지는 기반암 상면의 형상과 연속성, 풍화층의 투수성 분포에 전적으로 달려 있습니다. 기반암에 균열이나 결손이 있으면 용액은 그대로 지하수로 들어가고, 이것이 이 방식의 암모니아성 질소 오염 문제의 물리적 원인입니다.'));
body.push(H2('2.3 왜 같은 화면에 놓는가'));
body.push(P('두 방식은 시약이 다를 뿐 “지하에서 녹여 회수한다”는 점에서 정책 논의에서 자주 뭉뚱그려집니다. 그러나 봉쇄 가능성은 시약이 아니라 수리지질이 결정합니다. 패턴식은 양수로 흐름의 방향을 만들 수 있고 감시·경보·복원이 하나의 체계로 작동하지만, 사면식은 구조적으로 그럴 수단이 없고 자연 차수층에 의존합니다. 프로토타입은 이 차이를 같은 지표(회수율, 유실률, 안전 여유)로 나란히 보여주는 것을 목표로 합니다. 이 문서의 나머지는 그 “나란히”가 어떤 계산으로 만들어지는가를 설명합니다.'));

/* ───────────── 3 ───────────── */
body.push(H1('3. 공통 이론 배경'));
body.push(H2('3.1 다공질 매체와 Darcy 법칙'));
body.push(P('흙과 암석은 고체 골격과 그 사이의 공극으로 이루어집니다. 공극률 φ는 전체 부피 중 공극의 비율이고, 물이 실제로 이동하는 속도(공극 속도 v)는 단위 단면적을 통과하는 유량(Darcy 속도 q)보다 1/φ배 빠릅니다. Darcy 법칙은 이 유량이 수두(hydraulic head) 경사에 비례한다는 실험 법칙입니다.'));
body.push(...EQ('darcy', '식 (1). q: Darcy 속도 [m/d], K: 수리전도도 [m/d], h: 수두 [m], p: 압력 [Pa], z: 표고 [m], k: 고유투수율 [m²], μ: 점성 [Pa·s]. 수리전도도 K는 매질과 유체의 성질을 함께 담고, 고유투수율 k는 매질만의 성질입니다. 브라우저 모델은 K를, OpenGeoSys는 k를 입력으로 받으므로 환산이 필요합니다(6.5절).'));
body.push(P('수리전도도는 자릿수 단위로 달라집니다. 이 프로토타입의 사면 모델은 Yuan et al.(2025)의 이온흡착형 광상 현장 값을 그대로 씁니다: 표토 7.08, 완전풍화 광석층 2.59, 반풍화층 1.30, 기반암 3.8×10⁻⁴ m/d. 광석층과 기반암 사이가 약 7,000배 차이 나며, 이 대비가 “기반암 위에 고여 사면 아래로 흐른다”는 거동을 만듭니다.'));
body.push(H2('3.2 피압대수층의 흐름 방정식과 Thiem 식'));
body.push(P('두께 B의 대수층이 위아래로 불투수층에 갇혀 있으면(피압, confined) 흐름은 수평 2차원으로 근사할 수 있습니다. 질량보존과 Darcy 법칙을 결합하면 수두에 대한 확산 방정식이 나오고, 정호는 점 소스·싱크로 들어갑니다.'));
body.push(...EQ('confined', '식 (2). S_s: 비저류계수, T = KB: 투수량계수 [m²/d], Q_w: 정호 유량(주입 +, 양수 −) [m³/d]. 저류를 무시하면(정상 상태) 소스가 있는 Laplace(Poisson) 방정식이 됩니다. 브라우저 모델은 이 정상 상태 식을 풉니다. 피압대수층은 수두 변화에 대한 응답이 수 시간~수 일로 빠르므로, 수백 일 규모의 침출 운영에서는 매 시점 정상 상태로 보는 것이 합리적인 근사입니다.'));
body.push(P('단일 정호 주위의 정상 상태 해는 Thiem 식으로, 주어진 수두 강하(또는 상승) Δs로 낼 수 있는 유량의 상한을 줍니다. 브라우저 모델은 이것으로 주입량의 물리적 상한을 정합니다.'));
body.push(...EQ('thiem', '식 (3). r_e: 영향 반경(여기서는 정호 간격 s), r_w: 정호 반경(0.1 m), Δs: 허용 수두 상승(15 m). K=1 m/d, B=8 m, s=50 m이면 Q_max ≈ 121 m³/d로, 기본 주입량 100 m³/d는 이 안에 있습니다. K를 0.5 m/d로 내리면 상한이 60 m³/d로 떨어지고 화면의 유효 주입량이 잘립니다.'));
body.push(H2('3.3 불포화 흐름 — Richards 식과 그 단순화'));
body.push(P('지하수면 위의 흙은 공극 일부만 물로 차 있습니다(불포화). 여기서는 수리전도도가 함수비에 따라 급격히 변하고, 물은 모세관 흡인(음의 압력수두 ψ)과 중력의 합으로 움직입니다. 이를 기술하는 것이 Richards 식입니다.'));
body.push(...EQ('richards', '식 (4). θ: 체적함수비, ψ: 압력수두(불포화에서 음수), K(θ): 함수비에 따른 수리전도도. θ–ψ 관계(수분특성곡선)와 K–θ 관계는 van Genuchten, Brooks–Corey 등의 경험식으로 주어지며, 강한 비선형성 때문에 수치적으로 풀기 까다롭습니다.'));
body.push(P('프로토타입은 Richards 식을 직접 풀지 않습니다. 대신 모세관 항을 버리고 중력 배수만 남긴 “tipping-bucket(양동이)” 모형을 씁니다. 각 격자 셀은 최대 w_s(포화 함수량)까지 물을 담을 수 있고, 잔류 함수량 w_r 이상의 물만 이동 가능하며, 이동 능력은 유효포화도의 세제곱에 비례합니다.'));
body.push(...EQ('se_k', '식 (5). S_e: 유효포화도(0~1), θ_s, θ_r: 포화·잔류 함수비. K ∝ S_e³은 Campbell(1974)·Brooks–Corey 계열의 상대투수도 관계를 지수 3으로 고정한 것입니다. 실제 값은 흙마다 2~5 사이입니다.'));
body.push(P('이 단순화의 의미는 명확합니다. 모세관 흡인이 없으므로 물은 옆으로 “빨려 퍼지지” 않고, 아래로 떨어지다가 K가 낮은 층 위에 고여 옆으로 흐릅니다. 실제 사면에서 관찰되는 거동(기반암 위 침윤선 형성, 하부 집액)은 재현되지만, 주입 초기의 습윤 전선 속도와 건조한 상부층의 지연은 정확하지 않습니다. 이 부분이 사면 모듈에서 참조해 검증이 필요한 첫 번째 항목이며, OpenGeoSys의 RichardsFlow 프로세스가 후보입니다(9장).'));
body.push(H2('3.4 용질 이동 — 이류·분산 방정식'));
body.push(P('물에 녹은 물질(침출액, 추적자, 희토류 이온)은 물과 함께 흘러가고(이류, advection), 공극 구조 때문에 경로별 속도가 달라 번지며(기계적 분산, mechanical dispersion), 분자 확산으로 퍼집니다. 이 셋을 합친 것이 이류–분산 방정식(ADE)입니다.'));
body.push(...EQ('ade', '식 (6). C: 농도 [mol/m³], D: 수리동역학적 분산 텐서 [m²/d], Q_C: 소스·싱크 [mol/m³/d]. 첫 항은 저장, 둘째는 이류, 셋째는 분산, 우변은 정호·반응입니다.'));
body.push(...EQ('disp', '식 (7). Bear(1972)의 분산 텐서. α_L, α_T: 종·횡 분산도 [m], D_m: 유효 분자확산계수 [m²/d]. 분산은 흐름 방향으로 α_L|v|, 직각 방향으로 α_T|v|만큼 일어나므로 텐서는 속도 방향에 따라 회전합니다. 분산도는 척도 의존적이어서 실험실에서는 cm, 현장 수십 m 규모에서는 m 단위입니다. 기본값 α_L = 2 m, α_T = 0.2 m는 정호 간격 50 m 규모의 사암 대수층 문헌값 범위 안의 보수적 선택입니다.'));
body.push(P('수치해석에서 이류와 분산의 상대 크기는 격자 Peclet 수로 가늠합니다.'));
body.push(...EQ('peclet', '식 (8). Pe가 2보다 크면 중심차분 이류항이 진동하고, 풍상차분(upwind)은 진동 대신 인공적인 번짐(수치분산)을 만듭니다. 기본 격자 Δx = 3.6 m, α_L = 2 m이면 Pe ≈ 1.8로 경계 근처입니다. 5.6절에서 이 수치분산을 정량화하고 보정합니다.'));
body.push(H2('3.5 이온교환 침출 화학과 반응 속도식'));
body.push(P('이온흡착형 광상의 희토류는 점토 표면에 수화된 3가 양이온(RE³⁺)으로 붙어 있습니다. 황산암모늄((NH₄)₂SO₄) 용액을 흘리면 암모늄 이온이 이를 밀어내고 자리를 차지합니다.'));
body.push(...EQ('exchange', '식 (9). 화학량론상 RE³⁺ 1 mol당 NH₄⁺ 3 mol, 즉 (NH₄)₂SO₄ 1.5 mol이 필요합니다. 코드에서 침출액 소비를 1.5·r로 잡은 근거입니다. 실제로는 Al³⁺, Ca²⁺ 등 경쟁 양이온이 훨씬 많은 암모늄을 소비하므로 시약 소비량은 이 하한보다 큽니다.'));
body.push(P('프로토타입은 교환 평형을 명시적으로 풀지 않고 단일 속도식으로 대체합니다. 남아 있는 흡착량에 비례하고(1차), 침출액 농도에 대해 포화형(Langmuir/Monod형)으로 반응하며, 불포화 셀에서는 유효포화도만큼 접촉이 줄어듭니다.'));
body.push(...EQ('kinetic', '식 (10). S: 셀의 잔존 흡착 RE [mol], c: 셀 내 침출액 농도 [mol/m³], k_r: 속도상수(기본 0.30 /d), K_H: 반포화 농도(40 mol/m³), M_l, M_r: 셀 내 침출액·용존 RE 몰수. 침출액이 K_H보다 훨씬 진하면 속도는 k_r·S로 포화되고, 묽어지면 농도에 비례합니다. 한 단계에서 r은 잔존량 S와 가용 침출액 M_l/1.5를 넘지 못하도록 잘립니다. 사면 모듈은 여기에 S_e 인자가 곱해지고, 포화 모듈(패턴식)에서는 S_e = 1입니다.'));
body.push(P('광석 품위는 REO(RE₂O₃) 질량 %로 주어지므로 셀당 초기 흡착 몰수는 다음과 같이 환산합니다.'));
body.push(...EQ('ore', '식 (11). g: 품위 [% REO], ρ_b: 건조 밀도(1,900 kg/m³), M_RE2O3 ≈ 0.330 kg/mol, 화학식당 RE 2개. 회수된 RE 질량은 평균 원자량 0.140 kg/mol로 환산하고, 시약 소비는 (NH₄)₂SO₄ 몰질량 0.132 kg/mol로 톤 단위 환산합니다. k_r, K_H는 문헌 컬럼 실험의 “수십 일 안에 대부분이 용출된다”는 거동을 재현하도록 고른 값이며 실측 보정치가 아닙니다.'));
body.push(H2('3.6 사면 안정 — 한계평형과 Bishop 간이법'));
body.push(P('용액 주입은 사면의 함수량을 올려 단위중량을 키우고 간극수압을 만들며, 점토의 교환성 양이온이 바뀌면 전단강도가 떨어집니다. 이온흡착형 광산에서 사면 붕괴가 잦은 이유입니다. 프로토타입은 한계평형법 중 가장 널리 쓰이는 Bishop 간이법(1955)으로 원호 활동면의 안전율을 계산합니다.'));
body.push(...EQ('bishop', '식 (12). 활동 토체를 연직 절편(slice) n개로 나누고, 각 절편의 폭 b, 중량 W, 저면 경사 α, 저면 간극수압 u, 점착력 c, 내부마찰각 φ를 씁니다. 분모는 활동 모멘트, 분자는 저항 모멘트이며, m_α에 F가 들어 있어 반복으로 풉니다(초기값 1.3, 18회 이내 수렴). 여러 원호 중 가장 낮은 F가 사면의 안전율입니다.'));
body.push(P('강도 저하는 두 경로로 넣었습니다. 첫째, 포화된(S_e > 0.8) 절편은 습윤 강도 세트를 씁니다(예: 광석층 c 35→30 kPa, φ 28→25°). 둘째, 광석층은 침출 진행률에 따라 강도를 최대 30 % 깎습니다(잔존비 0이면 0.70배). 후자는 “교환성 양이온이 NH₄⁺로 바뀌면 점토 구조가 약해진다”는 관찰을 선형으로 근사한 것으로, 문헌 삼축시험의 감소 폭 범위 안에 있으나 특정 시료의 값은 아닙니다.'));

/* ───────────── 4 ───────────── */
body.push(H1('4. 사면 중력식 모듈의 수치 모델'));
body.push(...IMGP('docs/figs/sch_slope.png', 560, 274, '그림 4-1. 사면 중력식 개념도(중앙 종단면). 주입 → 연직 배수 → 기반암 상면 위 측방 흐름 → 집액구, 그리고 두 유실 경로.'));
body.push(H2('4.1 격자와 지질 모형'));
body.push(P('도메인은 100 m × 60 m × 70 m를 2.5 m 정육면체 셀 40 × 24 × 28개(26,880 셀)로 나눈 구조 격자입니다. 지표면은 x 방향으로 부드럽게 내려가는 S자 곡선(3t² − 2t³ 형태, 낙차 44 m, 평균 경사 sin β ≈ 0.42)에 y 방향 완만한 기복을 더한 해석 함수로 정의합니다. 각 셀은 지표면에서의 깊이에 따라 네 재료 중 하나를 받습니다.'));
body.push(table(['층', '깊이 (m)', 'K (m/d)', 'θ_s', 'θ_r', 'c 건/습 (kPa)', 'φ 건/습 (°)'], [
  ['표토', '0 – 1.5', '7.08', '0.42', '0.06', '32 / 27', '20 / 18'],
  ['완전풍화 광석층', '1.5 – 11.5', '2.59', '0.40', '0.08', '35 / 30', '28 / 25'],
  ['반풍화층', '11.5 – 18.0', '1.30', '0.36', '0.08', '40 / 35', '30 / 30'],
  ['기반암 (차수층)', '18.0 –', '3.8×10⁻⁴', '0.08', '0.02', '70 / 65', '45 / 42']], [1900, 1200, 1100, 800, 800, 1600, 1600]));
body.push(SP());
body.push(P('K 값은 Yuan et al.(2025) Table 1의 현장 측정치이고, 함수비와 강도는 풍화 화강암 규석토의 일반적 범위에서 골랐습니다. 셀 상태 변수는 물 높이 w [m, 셀 단면당 물 부피/면적], 침출액 몰수 M_l, 용존 RE 몰수 M_r, 흡착 RE 몰수 S입니다. 옵션 “기반암 차수층 결손”은 사면 중앙 아래의 기반암 셀 블록(x 16~25, y 7~16)의 K를 0.6 m/d로 올리고, “차수벽”은 최하류 두 열의 K를 10⁻⁷ m/d로 내립니다.'));
body.push(H2('4.2 주입 스케줄과 운영 단계'));
body.push(P('주입은 지표 셀(각 (i, j) 기둥의 최상단 셀)에 하루 0.042 m(42 mm/d, 슬라이더로 조정)의 물 높이를 더하는 방식입니다. 사면을 세 구역으로 나누어 상부(x < 33 %)는 0일, 중부(< 66 %)는 5일, 하부(< 92 %)는 10일부터 주입을 시작해 실제 광산의 단계별 착공을 흉내 냅니다. 최하류 8 %는 집액구 구역이라 주입하지 않습니다.'));
body.push(table(['단계', '기간 (일)', '주입', '침출액 농도'], [
  ['침출 (leach)', '0 – 35', '있음', '250 mol/m³ (NH₄)₂SO₄ ≈ 3.3 %'],
  ['정수 밀어내기 (push)', '35 – 77', '있음', '0 (맑은 물로 잔류 모액을 밀어냄)'],
  ['배수 (drain)', '77 – 120', '없음', '—']], [2400, 1600, 1200, 3800]));
body.push(SP());
body.push(...EQ('slope_w', '식 (13). 주입 후 셀이 포화 용량 w_s를 넘으면 초과분은 지표 유출(runoff)로 처리해 유실 계정에 더하고, 셀의 용질도 같은 비율로 함께 내보냅니다.'));
body.push(H2('4.3 연직 배수 알고리즘'));
body.push(P('시간 단계 Δt = 0.05 d(1.2시간)마다 다음 순서로 계산합니다: (1) 주입, (2) 반응, (3) 연직 유량 계산 후 이동, (4) 측방 유량 계산 후 이동, (5) 집액. 연직 유량은 위에서 아래로 훑으며 각 셀이 바로 아래 셀로 보낼 수 있는 양을 세 가지 제한의 최솟값으로 정합니다.'));
body.push(...EQ('slope_qz', '식 (14). K_a: 현재 셀의 유효포화도로 줄인 수리전도도, K_{s,b}: 아래 셀의 포화 수리전도도, K_f: 두 값의 조화평균(면 투수도). 세 제한은 순서대로 (a) 하루에 K_f만큼의 물 높이만 통과(단위 수두 경사 = 중력 배수), (b) 이동 가능한 물(잔류 이상)만, (c) 아래 셀의 빈 용량만큼만. 조화평균 때문에 기반암(K 3.8×10⁻⁴) 위의 면은 위쪽 셀이 아무리 젖어도 거의 통과시키지 않고, 결손 블록(0.6 m/d)은 통과시킵니다.'));
body.push(P('맨 아래 셀(k = 0)에서 나가는 물은 도메인 밖으로 빠지는 “기반암 누수”로 유실 계정에 더합니다. 이동 시 용질은 물과 같은 비율로 따라갑니다(완전 혼합 셀 가정). 이 명시적 순차 갱신은 셀이 한 단계에 담긴 물 이상을 내보낼 수 없어 자동으로 안정하며, 별도의 CFL 조건이 필요 없습니다.'));
body.push(H2('4.4 측방 흐름과 유출 경로'));
body.push(P('측방 흐름은 사면 아래 방향(+x)으로만, 유효포화도가 0.8 이상인 셀에서만 일어납니다. 이 문턱값은 “거의 포화된 층(기반암 위 침윤대)에서만 측방 유동이 의미 있다”는 kinematic-wave 근사에 해당하며, 불포화 상태에서의 미약한 측방 흐름은 무시합니다.'));
body.push(...EQ('slope_qx', '식 (15). 구동력은 사면 경사 sin β(0.42)로 고정한 단위 경사입니다(수두 차를 풀지 않음). 한 단계에 이동 가능한 물의 절반까지만 보내 진동을 막습니다. 최하류 열(i = NX−1)에서 나가는 물은 “측면 유출”로 유실 계정에 더하며, 차수벽 옵션이 켜지면 0이 됩니다.'));
body.push(P('따라서 유실은 세 계정으로 나뉘어 기록됩니다: 지표 유출(runoff), 기반암 누수(bottom), 측면 유출(side). 화면의 유실률은 이 셋의 합을 총 주입량으로 나눈 값입니다.'));
body.push(H2('4.5 집액구·유도공·차수벽·펌프백'));
body.push(P('집액구는 최하류 10 % 구간(i ≥ 36)에서 기반암 바로 위 셀(재료가 3에서 2로 바뀌는 경계의 위쪽 셀)로 정의합니다. 매 단계 이 셀들에서 이동 가능한 물의 일정 비율을 회수합니다.'));
body.push(...EQ('slope_drain', '식 (16). η: 집액 효율. 기본 0.55에 유도공(guide holes, GH) +0.15, 차수벽(cutoff wall, CW) +0.12, 펌프백(pump-back, PB) +0.08을 더하되 0.92를 넘지 않습니다. 펌프백은 집액구 상류 4열의 같은 위치 셀에서 절반 효율로 추가 회수합니다. 이 계수들은 물리 계산이 아니라 “대책이 있으면 집액이 이만큼 좋아진다”는 가정값이며, 대책 간 비교의 방향만 보여줍니다.'));
body.push(H2('4.6 침출 반응의 이산화'));
body.push(P('식 (10)을 광석층 셀에서 명시적으로 적분합니다. 침출액 농도가 1 mol/m³ 미만이면 반응을 건너뛰고, 한 단계의 반응량 r은 min(k_r·S·c/(K_H+c)·S_e·Δt, S, M_l/1.5)입니다. 반응은 이동 전에 계산되므로 “그 단계에 셀에 있던 침출액”이 반응합니다. Δt = 0.05 d, k_r = 0.30 /d이면 단계당 최대 1.5 %만 변하므로 명시적 적분이 안정합니다.'));
body.push(H2('4.7 안정성 계산의 구현'));
body.push(P('안전율은 계산 비용 때문에 매 단계가 아니라 화면 갱신 시점마다 중앙 종단면(j = NY/2)에서 계산합니다. 원호 중심은 x = 0.30~1.06 L_x(0.15 간격), 지표면 위 높이 12~72 m(12 m 간격), 반지름 22~118 m(13 m 간격)의 격자로 탐색하며, 지표면을 6개 이상 절편으로 자르고 기반암 하단을 뚫지 않는 원호만 평가합니다. 절편 중량은 각 기둥의 재료 단위중량(15 kN/m³)에 함수량에 의한 물 무게(9.81·θ)를 더해 누적한 표에서 보간합니다. 간극수압은 그 기둥에서 S_e > 0.92인 최상단 높이(침윤선)를 지하수면으로 보고 그 아래 깊이 × 9.81 kPa로 잡습니다. 화면의 “침윤대 두께”는 같은 기준(S_e > 0.92)으로 셀 기둥마다 잰 포화 구간의 최대 두께입니다.'));
body.push(H2('4.8 지표의 정의와 물질수지'));
body.push(...EQ('slope_metrics', '식 (17). R: 회수율(집액구로 회수된 RE 몰수 / 초기 흡착 몰수), L: 유실률(세 유실 계정의 물 부피 / 총 주입 부피), c_liquor: 모액 농도(회수 물의 RE 몰농도 × 평균 원자량, kg/m³ = g/L). 시약 소비는 주입 몰수 × 0.132 kg/mol.'));
body.push(P('물질수지 검사: 매 시점 (도메인 내 물) = (주입) − (회수) − (유실)이 성립해야 하며, 코드는 stored() 함수로 도메인 내 이동 가능 물의 총량을 계산해 이 등식을 확인할 수 있게 합니다. RE에 대해서도 (흡착 잔존 + 용존 + 회수 + 유실) = 초기 흡착량이 유지됩니다. 모든 이동이 “한 셀에서 빼서 다른 셀에 더하는” 형태이므로 부동소수점 오차 외에는 보존이 정확합니다.'));

/* ───────────── 5 ───────────── */
body.push(H1('5. 정호 패턴식 모듈의 수치 모델'));
body.push(...IMGP('docs/figs/sch_pattern.png', 520, 372, '그림 5-1. 정호 패턴식 개념도(평면). 5-spot 2×2 패턴, 외곽 회수정, 감시 링, bleed에 따른 봉쇄.'));
body.push(H2('5.1 개념 모델과 가정'));
body.push(B('두께 B = 8 m의 균질·등방 피압대수층. 수직 방향 변화는 없다(2차원 평면, depth-averaged).'));
body.push(B('수리전도도 K = 1 m/d, 공극률 φ = 0.30, 지역 지하수 경사 i = 0.002 (−x 방향 수두 감소).'));
body.push(B('흐름은 매 시점 정상 상태(저류 무시). 정호 유량이 바뀌는 순간(복원 전환)에만 수두를 다시 푼다.'));
body.push(B('밀도·점성은 일정(침출액 농도가 흐름에 영향을 주지 않음). 침출액과 RE 이온은 같은 속도장으로 이동한다.'));
body.push(B('도메인은 정사각형이며 한 변 L = max(200 m, W + 2(r + 44 m))이다. W는 정호군 폭(5-spot (n+1)s, 7-spot 1.84ns + s, 선형 max((n+1)s, 1.2ns + s)), r은 감시 링 거리 25 m. 항상 80 × 80 셀로 나누므로 Δx = L/80. 기본 5-spot 50 m에서 L = 288 m, Δx = 3.6 m이고, 12개 라이브러리 케이스는 228~372 m(Δx 2.85~4.65 m)이다. OGS 참조해도 같은 공식을 쓴다(runner/make_case.py의 studio_domain).'));
body.push(H2('5.2 정호 배치 생성'));
body.push(P('패턴 종류(5-spot, 7-spot, 선형), 간격 s, 규모 n, 외곽 정호 종류(회수정/주입정)로부터 정호 좌표를 만듭니다. 5-spot은 (n+1)² 개의 A형 정호 격자와 그 중앙 n² 개의 B형, 7-spot은 육각 격자에서 세 개 중 하나를 B형으로, 선형은 2n+1 열을 A/B 교대로 배치합니다. 외곽 정호를 회수정으로 두면(기본) 주입정이 안쪽에 갇혀 봉쇄가 유리하고, 반대로 두면 주입정이 밖에 있어 유출이 쉬워집니다. 각 정호는 좌표를 포함하는 셀에 놓이고, 유량은 그 셀의 소스로 들어갑니다. 광체 범위는 정호 외곽 사각형에서 s/2를 더한 사각형으로 정의하며, 이 안의 셀만 흡착 RE를 가집니다.'));
body.push(...EQ('pv', '식 (18). PV(공극체적): 광체 범위의 공극 부피. 1 PV 시간은 총 주입량으로 PV를 채우는 데 걸리는 시간이며, 화면의 시간축은 이 PV로 표시됩니다(기본 5-spot 50 m: 약 135일/PV). β: bleed. 총 회수량은 총 주입량의 (1+β)배이고 회수정 수로 균등 분배합니다. β < 0이면 주입이 양수를 초과해 봉쇄가 깨집니다.'));
body.push(H2('5.3 수두 해 — 유한차분과 SOR'));
body.push(P('식 (2)의 정상 상태를 셀 중심 5점 유한차분으로 이산화하고 SOR(Successive Over-Relaxation) 반복으로 풉니다. 경계 셀(테두리 한 줄)은 지역 경사에 따른 고정 수두 h = −i·x(Dirichlet)이고, 정호 셀은 소스항 Q/(ΔxΔy)를 가집니다.'));
body.push(...EQ('sor', '식 (19). ω = 1.82는 80×80 격자에서 경험적으로 빠른 완화계수입니다(1 < ω < 2). 최대 800회 반복, 최대 변화 2×10⁻⁵ m 이하면 종료합니다. Δx = Δy이므로 소스항은 Q/T로 단순해집니다.'));
body.push(...EQ('face', '식 (20). 수두에서 셀 면의 체적 유량 F [m³/d]와 면 공극 속도 v를 구합니다. F는 이후 용질 이동의 “운반 용량”이고, v는 유선 추적과 분산 계수에 씁니다. 셀 중심 속도는 양쪽 면 속도의 평균입니다.'));
body.push(H2('5.4 속도장과 유선 추적'));
body.push(P('봉쇄 여부를 직관적으로 보여주기 위해 각 주입정 주위 반지름 2.5 m의 원 위 12점에서 유선을 출발시킵니다. 셀 중심 속도를 쌍선형 보간해 방향만 취하고(단위 벡터), 중점법(2차 Runge–Kutta)으로 한 걸음 Δs = max(1.2 m, Δx/2)씩 전진합니다.'));
body.push(...EQ('stream', '식 (21). 최대 900걸음. 회수정 반경 max(2.6 m, 0.8Δx) 안에 들어오면 “포집(captured)”, 도메인 가장자리 한 셀 안에 닿으면 “탈출(escaped)”, 속도가 0에 가까워 멈추면 “정체(stagnant)”로 분류합니다. 탈출 유선 비율이 화면의 봉쇄 지표이며, 유선은 방향만 따라가므로 도착 시간 정보는 없습니다(용질 이동은 별도로 5.5절에서 계산).'));
body.push(H2('5.5 용질 이동 — 풍상 유한체적과 명시적 분산'));
body.push(...IMGP('docs/figs/sch_stencil.png', 560, 215, '그림 5-2. (좌) 셀 중심 격자와 면 유량. (우) 계단형 농도 전선이 수치분산·물리분산으로 번지는 모습(개념).'));
body.push(P('셀의 용질 질량 M = C·V(V = φ B Δx Δy)를 면 유량 F로 옮깁니다. 면을 지나는 농도는 유량이 나오는 쪽(상류) 셀의 농도로 잡는 1차 풍상차분(first-order upwind)입니다. 이 선택은 진동이 없고 농도가 음수가 되지 않으며 질량이 정확히 보존된다는 장점이 있고, 대신 5.6절의 수치분산을 만듭니다.'));
body.push(...EQ('upwind', '식 (22). 침출액(C_l)과 용존 RE(C_r) 두 성분을 같은 식으로 옮깁니다. 주입정은 c_inj 농도의 물을, 회수정은 그 셀 농도의 물을 넣고 뺍니다. 도메인 가장자리에서 밖으로 나가는 유량은 “경계 유출” 계정(lsOut)에 누적합니다.'));
body.push(...EQ('cfl', '식 (23). 명시적 기법의 안정 조건. 첫째는 한 단계에 셀이 담긴 것 이상을 내보내지 않는 CFL(Courant) 조건(안전계수 0.7), 둘째는 명시적 분산의 조건(2차원 안전계수 0.2). 두 조건의 최솟값을 0.01~0.6 d로 잘라 부단계 Δt_sub로 쓰고, 화면 프레임마다 여러 부단계를 돌립니다. 정호 셀은 유량이 커서 보통 CFL이 지배하며 기본 시나리오에서 Δt_sub ≈ 0.22 d입니다.'));
body.push(P('물리 분산은 식 (7)의 텐서를 면에서 평가하되 교차항(D_xy)은 생략하고 대각 성분만 씁니다. x면에서는 그 면의 x 속도와 인접 셀 중심 y 속도의 평균으로 |v|를 만듭니다.'));
body.push(...EQ('disp_fv', '식 (24). 면 분산 플럭스는 농도 차의 중심차분입니다. 교차항 생략은 흐름이 격자축에 비스듬할 때 횡분산을 약간 과소평가하지만, 5-spot의 주 흐름은 대각선 방향이라 오차가 실제로 나타나며, 참조해와의 차이 원인 중 하나로 8.4절에 기록했습니다.'));
body.push(H2('5.6 수치분산과 유효 분산도 보정'));
body.push(P('1차 풍상차분은 Taylor 전개에서 확산항 형태의 절단 오차를 남깁니다. 1차원 정상 이류에서 그 크기는 정확히 계산됩니다.'));
body.push(...EQ('numdisp', '식 (25). 격자 자체가 분산도 Δx/2(기본 격자에서 1.8 m)를 이미 갖고 있다는 뜻입니다. 여기에 목표 α_L = 2 m를 그대로 더하면 실제 분산은 3.8 m가 되어 참조해보다 훨씬 번집니다(4일차 실험에서 sweep +1.5 %p 과대로 확인). 그래서 슬라이더의 목표값에서 Δx/2를 뺀 값을 유효 분산도로 쓰고, 목표가 Δx/2보다 작으면 물리 분산을 넣지 않습니다. 횡분산 α_T는 풍상차분의 수치 횡분산이 대각 흐름에서만 생기고 정량화가 어려워 보정하지 않습니다. OGS로 내보내는 scenario.json에는 목표값이 그대로 실립니다.'));
body.push(P('이 보정은 등속 1차원 결과를 2차원 비균일 속도장에 적용한 것이므로 근사입니다. 정호 근처처럼 속도가 급변하는 곳에서는 수치분산이 국소적으로 Δx/2와 다르고, 그 잔차가 참조해와의 남은 차이(sweep 평균 −1.5 %p, 파과 수 일)에 기여합니다.'));
body.push(H2('5.7 침출 반응·회수·복원'));
body.push(P('반응은 식 (10)에서 S_e = 1로 두고 광체 셀에서만 이동 전에 계산합니다. 회수정에서 나간 용존 RE 몰수를 누적해 회수율(초기 흡착 몰수 대비)과 모액 농도를 만듭니다. 누적 회수율이 50 %, 80 %에 도달한 PV를 기록해 “몇 PV를 돌려야 하는가”를 보여줍니다. 누적 양수 PV가 침출 종료 PV(기본 5)에 도달하면 복원 단계로 들어가 주입 유량을 0으로 두고 수두를 다시 풀며, 양수는 계속되어 잔류 침출액을 뽑아냅니다(기본 2 PV). 이때 유선은 다시 추적되지만 봉쇄 지표는 침출 단계의 값을 유지합니다.'));
body.push(H2('5.8 감시 링과 UCL 규칙'));
body.push(P('광체 범위에서 25 m 바깥의 사각 링에 감시정 12공(변마다 3공)을 둡니다. 2일마다 시료를 채취해 침출액 농도가 주입 농도의 3 %(UCL)를 넘는지 보고, 2회 연속 초과하면 경보를 냅니다. 이는 미국 ISR 우라늄 규제(NRC/주정부 허가)의 “UCL 초과 → 확인 시료 → 시정조치” 절차를 단순화한 것입니다. 경보 수는 화면 상태 상자에 표시되며, 운영을 자동으로 바꾸지는 않습니다.'));
body.push(H2('5.9 지표의 정의'));
body.push(...EQ('pattern_metrics', '식 (26). sweep 접촉율: 광체 셀 중 침출액 농도가 주입 농도의 5 %를 넘는 셀의 비율(“침출액이 닿은 광석의 비율”). 유실률 L: 경계 밖으로 나간 침출액 몰수와 광체 범위 밖 셀에 있는 침출액 몰수의 합을 총 주입 몰수로 나눈 값. 8단계마다 계산해 현재값과 최대값을 유지합니다. 회수율·모액 농도·시약 소비는 사면 모듈과 같은 정의입니다.'));

/* ───────────── 6 ───────────── */
body.push(H1('6. OpenGeoSys 참조해'));
body.push(H2('6.1 OpenGeoSys란'));
body.push(P('OpenGeoSys(OGS)는 다공질·균열 매체에서의 열(T)·수리(H)·역학(M)·화학(C) 연성 과정을 유한요소법으로 푸는 오픈소스 시뮬레이터입니다. 독일 헬름홀츠 환경연구센터(UFZ, 라이프치히)를 중심으로 드레스덴 공대, 독일 연방지질자원연구소(BGR) 등이 개발하며, 1980년대 RockFlow에서 출발해 2012년 Kolditz 등이 발표한 OGS-5를 거쳐, 현재의 OGS-6는 C++로 새로 작성한 판입니다. 방사성폐기물 처분장, 지열, CO₂ 지중저장, 지하수 오염 등 안전성 평가가 필요한 분야에서 벤치마크가 잘 갖춰진 도구로 쓰입니다. 라이선스는 BSD 3-clause이며 소스는 GitLab(gitlab.opengeosys.org)에 공개되어 있습니다.'));
body.push(P('이 프로젝트에서 OGS를 고른 이유는 세 가지입니다. (1) 브라우저 모델이 쓰는 근사(정상 흐름, 풍상차분, 대각 분산)를 쓰지 않는 독립적인 정식 해법이어서 “참조해”가 될 수 있다. (2) pip 한 줄로 설치되어 별도 빌드 없이 컨테이너 안에서 돌릴 수 있다. (3) 나중에 화학(ComponentTransport + PHREEQC), 불포화(RichardsFlow), 역학(HM)으로 확장할 때 같은 입력 체계를 유지할 수 있다.'));
body.push(H2('6.2 사용한 구성요소와 라이브러리'));
body.push(table(['구성요소', '출처 / 버전', '역할'], [
  ['ogs (실행 파일)', 'PyPI `ogs==6.5.9`', 'ComponentTransport 프로세스 해석. `ogs pattern.prj -o .` 로 실행'],
  ['generateStructuredMesh', 'OGS 유틸리티 (같은 패키지)', '80×80 절점의 사각형(quad) 구조 격자 생성. 절점을 브라우저 셀 중심에 맞춤'],
  ['ExtractBoundary', 'OGS 유틸리티', '도메인 경계 절점·요소 추출 → 고정 수두 경계 메시'],
  ['identifySubdomains', 'OGS 유틸리티', '주입정·회수정 절점 메시를 도메인 메시와 연결(bulk_node_ids 부여)'],
  ['meshio', 'PyPI', '.vtu 읽기·쓰기(정호 절점 메시 생성, 결과 시계열 읽기)'],
  ['numpy', 'PyPI', '결과 배열 처리, 지표 계산, 필드 파일 기록(runner/fields_io.py)'],
  ['jsonschema', 'PyPI', 'scenario.json 계약 v0.1 검증'],
  ['matplotlib', 'PyPI', '비교 그림 3장'],
  ['Eigen (OGS 내장)', 'OGS 빌드에 포함', '희소 선형대수. 직접법 SparseLU 사용'],
  ['VTK (OGS 내장)', 'OGS 빌드에 포함', '메시·결과 파일 형식(.vtu)']], [2400, 2400, 4200]));
body.push(SP());
body.push(P('OGS의 물성은 MPL(Material Property Library)이라는 통일된 체계로 매질(medium) → 상(phase) → 성분(component) 계층에 정의합니다. 이 케이스에서는 매질 하나, 수용액 상 하나, 성분(Tracer) 하나입니다.'));
body.push(H2('6.3 ComponentTransport 프로세스의 지배방정식'));
body.push(P('ComponentTransport(HC, hydro-component) 프로세스는 포화 다공질 매체의 액상 질량보존(압력)과 성분 질량보존(농도)을 함께 풉니다. OGS 문서(Kolditz et al. 2012; OGS-6 HC 프로세스 문서)의 식을 이 케이스의 설정에 맞게 적으면 다음과 같습니다.'));
body.push(...EQ('ogs_flow', '식 (27). 압력 p를 1차 변수로 하는 액상 질량보존. 이 케이스에서는 storage = 0, 밀도 일정(1,000 kg/m³), 점성 10⁻³ Pa·s, 중력 항 0(2차원 수평)으로 두어 브라우저와 같은 정상 흐름이 됩니다. k = 1.18×10⁻¹² m²는 K = 1 m/d의 환산값입니다.'));
body.push(...EQ('ogs_ct', '식 (28). 이류형(advective form, `non_advective_form=false`, 기본). R: 지연계수(1), λ: 감쇠율(0). 흐름이 비압축·정상이면 ∇·q = 0이므로 보존형과 수학적으로 같지만, 이산화 후에는 절점 소스·싱크의 취급이 달라집니다(6.6절).'));
body.push(...EQ('ogs_ct_cons', '식 (29). 보존형(`non_advective_form=true`). 유한요소 약형식에서 이류항이 부분적분되어 경계 플럭스 항이 생깁니다.'));
body.push(...EQ('ogs_D', '식 (30). OGS의 분산 텐서. Darcy 속도 q로 쓰고 φ가 곱해진 형태이므로 식 (7)에 φ를 곱한 것과 같습니다. D_p: 공극 확산계수(10⁻⁹ m²/s). 브라우저의 대각 근사와 달리 교차항을 포함합니다.'));
body.push(H2('6.4 공간·시간 이산화와 해법'));
body.push(table(['항목', '설정', '의미'], [
  ['요소', '4절점 사각형(quad), 차수 1', '쌍선형 형상함수. 절점 80×80 = 6,400개, 요소 79×79'],
  ['적분', 'integration_order 2', '요소당 2×2 Gauss 점'],
  ['시간', 'BackwardEuler, Δt = 1 d 고정', '완전 음해법(무조건 안정). 브라우저(명시적, ~0.1 d)와 대비'],
  ['비선형', 'Picard, 최대 25회', '압력·농도 연성을 고정점 반복으로. 이 문제는 선형에 가까워 1~2회에 수렴'],
  ['수렴', 'PerComponentDeltaX, NORM2, 1e-6 / 1e-8', '압력·농도 각각 상대 변화 기준'],
  ['선형 해법', 'Eigen SparseLU, scaling', '직접법. 6,400×2 미지수라 반복법 없이 충분'],
  ['출력', 'VTK, 5일마다', 'Tracer, pressure, darcy_velocity 절점값']], [1500, 3100, 4400]));
body.push(SP());
body.push(...EQ('ogs_be', '식 (31). 후진 Euler 이산화. M: 질량행렬, K: 이류–분산 강성행렬(속도장에 의존), b: 소스·경계 벡터. 매 단계 선형계를 직접법으로 풉니다. 기본 케이스(675일)는 1코어에서 약 7분입니다.'));
body.push(H2('6.5 경계조건·소스항·단위 환산'));
body.push(...EQ('ogs_p', '식 (32). 경계 절점의 압력 Dirichlet 조건. 기준 압력 2×10⁵ Pa에 지역 경사 i에 해당하는 ρ g i x를 뺍니다. 후처리에서 수두로 되돌립니다. 주입정 절점의 농도는 c_inj 고정(Dirichlet), 회수정 절점은 농도 조건 없이 물이 빠질 때 그 절점의 농도로 용질이 함께 나갑니다.'));
body.push(...EQ('ogs_unit', '식 (33). 절점 소스(Nodal source term)의 단위는 질량 유량 [kg/s]이며, 2차원 단위두께 문제이므로 대수층 두께 B로 나눕니다. 이 단위를 잘못 잡으면 수두 상승이 1,000배 어긋나므로, 1일차에 주입정 수두 상승(+9.3 m vs 브라우저 +8.4 m)으로 확인했습니다.'));
body.push(table(['양', '브라우저', 'OGS', '환산'], [
  ['수리전도도 / 투수율', 'K = 1 m/d', 'k = 1.18×10⁻¹² m²', 'k = Kμ/(ρg), K를 m/s로'],
  ['수두 / 압력', 'h [m], 경계 h = −i·x', 'p [Pa], p = 2×10⁵ − ρ g i x', 'h = (p − 2×10⁵)/(ρ g)'],
  ['정호 유량', 'Q [m³/d], 셀 소스', 'ṁ [kg/s], 절점 소스', 'ṁ = Q ρ / (86400 B)'],
  ['농도', 'C [mol/m³]', 'C (임의 단위, 250 입력)', '비 C/c_inj로 비교'],
  ['분산', 'α_L,e = α_L − Δx/2 (유효)', 'α_L = 2 m (목표) + 인공 ≈ 0.9 m', '8.4절 논의'],
  ['시간', 'd, Δt_sub ≈ 0.2 d 명시적', 's, Δt = 86400 s 음해', '결과 시각은 d로 환산'],
  ['격자', '80×80 셀 중심', '80×80 절점 = 셀 중심에 배치', '보간 없이 1:1 비교']], [1900, 2400, 2500, 2200]));
body.push(SP());
body.push(H2('6.6 수치 안정화 옵션과 4일차 결함'));
body.push(P('이류가 지배적인 문제(Pe > 2)에서 표준 Galerkin 유한요소는 진동합니다. OGS는 세 가지 안정화를 제공합니다. IsotropicDiffusion은 요소 크기와 속도에 비례하는 인공 확산을 등방으로 더하고, FullUpwind는 이류항을 풍상 방향으로 평가하며, FluxCorrectedTransport(FCT)는 저차 해에 제한된 반확산을 더해 단조성을 지킵니다.'));
body.push(...EQ('ogs_stab', '식 (34). 등방 확산 안정화의 크기(OGS 구현의 형태를 요약한 근사식). h_e: 요소 크기, δ: tuning_parameter(0.5). 이 케이스에서는 목표 물리 분산 2 m 위에 약 0.9 m의 인공 분산이 더해지며, 참조해가 브라우저보다 약간 더 번지는 방향으로 작용합니다.'));
body.push(P('4일차에 참조해 자체의 결함을 발견했습니다. 첫 템플릿(FullUpwind)은 회수정 절점에서 물은 빼는데 용질을 빼지 않아, 회수정 절점 농도가 주입 농도의 40~80배로 치솟고 도메인 내 추적자 총량이 주입 총량과 같았습니다(회수 0). 21일 검증에서는 파과 전이라 이 결함이 드러나지 않았습니다. 100일(파과 후) 4조합 실험 결과는 다음과 같습니다.'));
body.push(table(['형식', '안정화', '회수정 c/c_inj', '잔존/주입', '판정'], [
  ['보존형 (식 29)', '있음/없음', '18 – 26', '1.00', '싱크가 용질을 제거하지 않음'],
  ['이류형 (식 28)', 'FullUpwind', '8 – 12', '1.02', '안정화가 절점 싱크를 못 봄 (v0)'],
  ['이류형', '없음', '0.55 – 0.77', '0.70', '맞음. 단 진동 −0.13 ~ +1.09'],
  ['이류형', 'IsotropicDiffusion 0.5', '0.32 – 0.45 (60일)', '무안정화와 동일', '맞음 + 진동 −0.009 → 채택']], [1700, 1900, 1600, 1300, 2500]));
body.push(SP());
body.push(P('FCT는 이 설정에서 무시되었습니다(무안정화와 결과 동일). 교훈은 두 가지입니다. 첫째, 절점 싱크에서 용질이 함께 빠지려면 이류항이 절점 값에 직접 작용하는 이류형이어야 하며, 부분적분된 보존형이나 풍상 평가는 절점 싱크와 결합하지 않습니다. 둘째, 참조해를 믿기 전에 물질수지(도메인 잔존 = 주입 − 회수)부터 검사해야 합니다. run_case.py는 이제 이 검사(retained/injected < 0.95, 회수정 c/c_inj < 1.2)를 결과에 넣고, 스튜디오는 결함 참조해를 불러오면 경고합니다.'));
body.push(...IMGP('docs/figs/fig3_mass_balance.png', 500, 257, '그림 6-1. 물질수지 지표. 결함 참조해 두 개(회색)는 1.0에 붙어 있고, 수정된 참조해(주황)와 브라우저(파랑)는 파과 후 함께 내려간다.'));
body.push(H2('6.7 프로젝트 파일(prj) 해부'));
body.push(P('OGS 입력은 XML 프로젝트 파일 하나와 메시 파일들입니다. 템플릿(runner/templates/pattern_hc.prj.tmpl)의 블록을 순서대로 설명합니다. 중괄호 항목은 make_case.py가 scenario.json에서 채웁니다.'));
body.push(table(['블록', '내용'], [
  ['<meshes>', 'domain.vtu(도메인), boundary.vtu(경계), inj.vtu, prod.vtu(정호 절점). 부분 메시는 bulk_node_ids로 도메인과 연결'],
  ['<processes>', 'type ComponentTransport, integration_order 2, non_advective_form false, 변수 Tracer·pressure, 2차 변수 darcy_velocity, numerical_stabilization IsotropicDiffusion(tuning 0.5, cutoff 0)'],
  ['<media>', 'medium 0: AqueousLiquid 상(density, viscosity), 성분 Tracer(pore_diffusion, retardation_factor 1, decay_rate 0), 매질 물성 permeability, porosity, longitudinal/transversal_dispersivity, storage 0'],
  ['<time_loop>', 'Picard 비선형, PerComponentDeltaX 수렴, BackwardEuler, FixedTimeStepping(Δt, 반복 수), VTK 출력 간격'],
  ['<parameters>', 'p0(초기 압력), p_bc(Function: 200000 − ρgi·x), c0, c_inj, q_inj, q_prod'],
  ['<process_variables>', 'pressure: 초기 p0, 경계 Dirichlet p_bc, 소스 Nodal q_inj(inj), q_prod(prod). Tracer: 초기 c0, 주입정 Dirichlet c_inj'],
  ['<nonlinear_solvers>, <linear_solvers>', 'Picard 25회 / Eigen SparseLU scaling']], [2400, 6600]));
body.push(SP());
body.push(CODE('<process><name>hc</name><type>ComponentTransport</type><integration_order>2</integration_order>'));
body.push(CODE('  <non_advective_form>false</non_advective_form>'));
body.push(CODE('  <process_variables><concentration>Tracer</concentration><pressure>pressure</pressure></process_variables>'));
body.push(CODE('  <numerical_stabilization><type>IsotropicDiffusion</type><cutoff_velocity>0</cutoff_velocity><tuning_parameter>0.5</tuning_parameter></numerical_stabilization>'));
body.push(CODE('</process>'));
body.push(CODE('<source_term><mesh>prod</mesh><type>Nodal</type><parameter>q_prod</parameter></source_term>   <!-- kg/s, 음수 -->'));
body.push(SP());
body.push(H2('6.8 파이프라인 — scenario.json에서 화면까지'));
NUMSTART();
body.push(NUM('스튜디오 패턴 탭에서 “scenario.json 내보내기”. 격자(nx, ny, 도메인, 두께), 대수층(K, φ, 경사, α_L, α_T, D_p), 정호(패턴, 간격, 규모, 외곽, Q, bleed), 화학(농도, tracer_only), 일정(leach_pv, restore_pv, dt_days), 감시(링 거리, UCL)를 계약 v0.1(schema/scenario.schema.json)로 저장합니다.'));
body.push(NUM('runner/validate.py로 스키마 검증. runner/make_case.py가 정호 좌표를 스튜디오와 같은 규칙으로 생성하고(도메인 크기가 스튜디오 공식과 다르면 경고), generateStructuredMesh → ExtractBoundary → identifySubdomains로 메시를 만들고, 템플릿에 값을 채워 pattern.prj를 씁니다. case_meta.json에 절점 ID와 1 PV 일수를 기록합니다.'));
body.push(NUM('runner/run_case.py가 ogs를 실행하고, 5일마다 나온 .vtu를 읽어 절점값을 브라우저 셀 순서(i + j·nx)로 재배열해 필드 파일 fields.v2.bin.gz와 results.json(시각, 정호, sweep, 광체 밖 분율, 물질수지, 필드 형식)을 씁니다. 필드 파일은 수두를 한 번만(정상류라 첫 풀이 이후 변하지 않음) Float32로, 추적자를 시각마다 [−0.25, 1.25] 구간 16비트 정수로 양자화해 이어 붙인 뒤 gzip으로 묶은 것입니다. 양자화 오차는 주입 농도 대비 1.2 × 10⁻⁵, 크기는 케이스당 0.3~1 MB로 무압축 Float32(2~8 MB)의 약 1/10입니다.'));
body.push(NUM('runner/compare.py가 브라우저 스냅샷(같은 시각의 h, C_l 배열)과 비교해 수두 RMS, 추적자 MAE, sweep, 광체 밖 분율 차이를 출력합니다. 격자가 2배 다르면 블록 평균으로 맞춥니다.'));
body.push(NUM('스튜디오 목록(cases/index.json)에서 케이스를 고르거나 results.json + 필드 파일을 직접 불러오면, 필드를 풀어(gzip 해제·역양자화, 브라우저의 DecompressionStream) 격자·도메인 일치를 확인한 뒤 물질수지 결함을 경고하고, “OGS 참조해 표시”를 켜면 침출액·수두 모드가 OGS 필드를 그리며 지표에 RMS·R²·OGS sweep이 뜹니다.'));
body.push(P('헤드리스 비교(browser/make_browser_snapshots.js, library_browser.js)는 스튜디오의 패턴 모듈을 Node에서 그대로 돌려 화면 없이 스냅샷을 만듭니다. 12개 라이브러리는 runner/make_library.py로 병렬 실행하고(워커마다 OMP_NUM_THREADS=1. OGS가 코어마다 여러 스레드를 띄우면 서로 밀려 선형해법이 10배 가까이 느려집니다), runner/make_index.py가 스튜디오 목록 cases/index.json을 만듭니다.'));

/* ───────────── 7 ───────────── */
body.push(H1('7. 두 모델의 대응 관계'));
body.push(P('같은 시나리오를 두 모델이 어떻게 다르게 푸는지 항목별로 정리합니다. 이 표의 “다름” 열이 8.4절 차이 원인의 후보 목록입니다.'));
body.push(table(['항목', '브라우저 근사 (패턴 탭)', 'OGS 참조해', '다름'], [
  ['흐름 방정식', '정상 Poisson, 셀 중심 FD, SOR', '식 (27) 준정상(storage 0), FEM quad, 직접법', '이산화만 다름'],
  ['정호', '셀 소스 Q/(ΔxΔy)', '절점 소스 kg/s', '셀 vs 절점 → 정호 근처 수두 형상'],
  ['경계', '테두리 셀 h = −ix', '경계 절점 p = 2e5 − ρgix', '같음'],
  ['이류', '1차 풍상 FV, 명시적', 'Galerkin FEM 이류형, 음해', '수치분산 vs 진동/안정화'],
  ['분산', '대각 성분만, 유효 α_L = α_L − Δx/2', '완전 텐서, α_L = 2 m + 인공 0.9 m', '교차항·인공분산'],
  ['시간 적분', 'Δt_sub ≈ 0.2 d 명시적', 'Δt = 1 d 후진 Euler', '음해의 시간 확산'],
  ['주입정 농도', '주입 유량 × c_inj 질량 소스', '절점 Dirichlet c_inj', '정호 셀 농도가 다름(1 vs 1 이하)'],
  ['회수정', '셀 농도로 질량 제거', '절점 농도로 제거(이류형이어야 동작)', '같음(수정 후)'],
  ['반응', '있음(비교 시 grade 0.0001로 끔)', '없음(추적자)', '비교 시 같음'],
  ['복원 단계', '있음', '없음(침출만)', '비교는 침출 단계까지'],
  ['유선·감시·UCL', '있음', '없음(후처리 대상)', '—']], [1500, 2700, 2700, 2100]));
body.push(SP());

/* ───────────── 8 ───────────── */
body.push(H1('8. 검증 결과의 해석'));
body.push(H2('8.1 지표 정의'));
body.push(...EQ('rms', '식 (35). 수두 RMS 차는 흐름 해의 일치를, 추적자 MAE는 필드 전체의 평균 차이를 봅니다. 이 밖에 sweep 접촉율(식 26), 광체 밖 추적자 분율(광체 밖 셀 농도 합 / 전체 농도 합), 파과 시각(회수정 셀의 C/c_inj가 5 %를 처음 넘는 날)을 비교합니다.'));
body.push(...EQ('massbal', '식 (36). 물질수지 비. 참조해의 결함 검출용이며, 두 모델 모두 파과 후 함께 내려가야 합니다(그림 6-1).'));
body.push(H2('8.2 기준 시나리오 결과'));
body.push(P('5-spot, 간격 50 m, 규모 2×2, 외곽 회수정 9공, 주입정 4공 × 100 m³/d, bleed +5 %, 추적자만(반응 끔), α_L = 2 m, α_T = 0.2 m, 675일(5 PV).'));
body.push(table(['지표', '브라우저', 'OGS', '차이', '해석'], [
  ['수두 RMS 차', '—', '—', '0.13 m (수두 범위의 1 %; 12개: 1~3 %)', '흐름 해 일치. 차이는 정호 근처 셀/절점 형상'],
  ['sweep @ 1 PV', '70 %', '72 %', '−2 %p (12개 평균 −1.5 %p)', '분산 보정 후 잔차'],
  ['sweep @ 5 PV', '90 %', '91 %', '−1 %p', '장기적으로 수렴'],
  ['광체 밖 최대', '3.0 %', '3.5 %', '−0.5 %p', '봉쇄 성립 시 일치'],
  ['파과 시각', '35 d', '30 d', '+5 d (12개: −3 ~ +6 d)', '풍상차분의 전선 지연']], [1500, 1200, 1200, 2300, 2800]));
body.push(SP());
body.push(...IMGP('docs/figs/fig1_tracer_fields.png', 560, 187, '그림 8-1. 270일(2 PV) 추적자 필드. 브라우저(좌), OGS(중), 차이(우). 차이는 플룸 가장자리의 얇은 띠에 집중된다.'));
body.push(...IMGP('docs/figs/fig2_sweep_outside.png', 520, 187, '그림 8-2. sweep 접촉율과 광체 밖 추적자 분율 vs PV. 두 모델의 곡선이 겹친다.'));
body.push(H2('8.3 12개 시나리오 라이브러리'));
body.push(P('3 패턴(5-spot, 7-spot, 선형) × 2 간격(30, 50 m) × 2 bleed(+5 %, −10 %)의 12개를 같은 파이프라인으로 돌렸습니다(cases/LIBRARY.md). 도메인은 케이스마다 스튜디오 공식으로 정해 228~372 m입니다. 첫 계산에서는 12개 모두 288 m로 고정돼 있어 10개가 스튜디오와 다른 격자를 풀고 있었고, 이를 바로잡아 다시 계산한 것이 아래 수치입니다(COMPARE.md 부록 B). 요약하면:'));
body.push(B('수두 RMS: 5-spot 0.12~0.14 m(범위의 1.0~1.3 %), 7-spot 0.25~0.27 m(1.4~1.7 %), 선형 0.19~0.35 m(1.5~3.0 %). 정호가 촘촘한 선형 30 m에서 정호 근처 셀/절점 형상 차이가 가장 큽니다.'));
body.push(B('sweep @1 PV: 브라우저 − OGS 평균 −1.5 %p, 범위 −5.2 ~ +0.4 %p; @5 PV 평균 −0.7 %p. 봉쇄 성립(bleed +5 %) 6개에서는 −1.9 ~ −5.2 %p(평균 −2.9)로 브라우저가 일관되게 낮고, 봉쇄 실패(bleed −10 %)에서는 ±1 %p. 분산 보정 전(평균 −3.0 %p)보다 절반으로 줄었습니다.'));
body.push(B('광체 밖 최대: 봉쇄 성립에서는 ±0.6 %p. 봉쇄 실패에서는 브라우저가 2~3 %p 과대. 후자는 유출 플룸이 도메인 가장자리에 닿는 경우로, 브라우저의 “경계 밖 유출” 계정과 OGS의 경계 처리(고정 압력 절점에서의 이류 유출)가 달라서 생깁니다.'));
body.push(B('파과: −3 ~ +6일. 5-spot과 7-spot에서는 브라우저가 늦고, 선형에서는 같거나 빠릅니다.'));
body.push(H2('8.4 차이의 원인 분석'));
body.push(P('남은 차이는 크기 순으로 다음 원인에 귀속됩니다.'));
NUMSTART();
body.push(NUM('수치분산의 국소 잔차. 보정 Δx/2는 등속 1차원 값이며, 정호 근처와 정체점(stagnation point) 근처에서는 실제 수치분산이 다릅니다. 파과 지연의 주원인입니다.'));
body.push(NUM('분산 텐서 교차항 생략. 5-spot의 주 흐름이 격자 대각선 방향이라 횡분산이 과소평가됩니다. 플룸 가장자리 띠(그림 8-1 우)의 형태에 나타납니다.'));
body.push(NUM('참조해의 인공 분산 ≈ 0.9 m. 참조해가 “정답”보다 약간 더 번지는 방향. 두 모델의 실효 분산도는 각각 약 2 m(보정 후 목표)와 약 2.9 m로 추정되며, 이 차이만으로 sweep 0.5 %p 정도를 설명합니다.'));
body.push(NUM('주입정 농도 조건. 브라우저는 질량 소스라 정호 셀 농도가 1보다 낮고, OGS는 절점 Dirichlet로 정확히 1입니다. 정호 근처 몇 셀의 차이.'));
body.push(NUM('시간 이산화. 후진 Euler Δt = 1 d의 시간 확산 vs 명시적 약 0.2 d. 파과 곡선의 기울기에 약간 기여.'));
body.push(P('결론: 봉쇄가 성립하는 운영 범위에서 브라우저 근사는 참조해와 sweep에서 2~5 %p 낮게(보수적), 유출에서 1 %p 이내로 일치하며, 정책 시연과 정성 비교 용도로 충분합니다. 봉쇄가 깨지는 시나리오에서 유출량의 절대값은 브라우저가 보수적으로(크게) 나오므로, 그 숫자 자체를 인용해서는 안 됩니다.'));

/* ───────────── 9 ───────────── */
body.push(H1('9. 한계와 확장 경로'));
body.push(table(['영역', '현재', '한계', '확장 (OGS 프로세스)'], [
  ['사면 불포화 흐름', 'tipping-bucket, K = K_s S_e³', '모세관 없음, 습윤 전선 속도 부정확', 'RichardsFlow (van Genuchten), 참조해 비교'],
  ['사면 지질', '해석 지형 + 4층 균질', '실제 기반암 기복·균열 없음', '측량·시추 자료로 격자 생성'],
  ['패턴 대수층', '2D 균질 등방 피압', '층상·비균질·부분 피압 없음', 'ComponentTransport 3D, 비균질 k 필드'],
  ['화학', '단일 속도식, 경쟁 이온 없음', 'Al, Ca 경쟁·pH·침전 없음', 'ComponentTransport + PHREEQC(ChemistryLib)'],
  ['안정성', 'Bishop 2D 중앙 단면, 가정 강도', '3D 효과·실측 강도 없음', 'HM 프로세스 또는 별도 LEM 도구'],
  ['복원', '주입 정지 + 양수', '수질 회복 화학 없음', 'CurveScaled 유량 + 화학'],
  ['보정', '없음(문헌 기본값)', '실측 없이 절대값 인용 불가', '현장 추적자 시험·감시정 자료로 보정'],
  ['국내 적용', '가설로만 표시', '국내 포화대 이온흡착 광상 미확인', '탐사 자료 확보 후']], [1700, 2300, 2500, 2500]));
body.push(SP());
body.push(P('Phase 2로 넘길 우선순위는 (1) 사면 탭의 RichardsFlow 참조해, (2) 패턴 탭의 3D 층상 대수층, (3) PHREEQC 결합 화학입니다. 각 항목은 이 문서의 해당 절에 “교과서 식 → 구현 식”의 간격으로 이미 정의되어 있습니다.'));

/* ───────────── 10 ───────────── */
body.push(H1('10. 학습 가이드 — 프로그램으로 확인해 보는 연습'));
body.push(P('이론을 화면에서 확인하는 연습입니다. 각 항목은 어떤 식을 보고 있는지 표시했습니다.'));
NUMSTART();
body.push(NUM('Thiem 상한 (식 3): 패턴 탭에서 K를 1 → 0.3 m/d로 내리면 유효 주입량이 잘리는 것을 확인하고, 식 (3)으로 상한을 직접 계산해 비교하십시오.'));
body.push(NUM('봉쇄와 bleed (식 18): bleed를 +5 → 0 → −10 %로 바꾸며 탈출 유선 비율과 광체 밖 추적자 최대값을 기록하십시오. 지역 경사를 0.002 → 0.01로 올리면 봉쇄에 필요한 bleed가 얼마나 커지는지 보십시오.'));
body.push(NUM('격자 Peclet 수 (식 8, 25): 종분산도 α_L을 0, 2, 5 m로 바꾸며 sweep 곡선의 기울기와 파과 시각을 비교하십시오. 0 m와 1.8 m(=Δx/2)가 같은 결과를 주는 이유를 식 (25)로 설명하십시오.'));
body.push(NUM('PV 스케일링 (식 18): 간격을 30 → 50 m로 바꾸면 1 PV 일수가 얼마나 늘어나는지, sweep vs PV 곡선은 왜 거의 같은지 생각해 보십시오.'));
body.push(NUM('차수층의 역할 (식 14): 사면 탭에서 “기반암 차수층 결손”을 켜고 기반암 누수 계정이 언제부터 늘어나는지, 집액 회수율이 얼마나 줄어드는지 보십시오. 조화평균 K_f가 왜 결손 셀에서만 통과를 허용하는지 계산하십시오.'));
body.push(NUM('안전율 (식 12): 주입량을 42 → 80 mm/d로 올리고 침윤대 두께와 안전율의 시간 곡선을 보십시오. 강도 저하 30 %가 없다면 F가 어떻게 달라질지 추정하십시오.'));
body.push(NUM('물질수지 (식 36): OGS 키트의 cases/base_v0_buggy/results.json을 스튜디오에 불러와 경고를 확인하고, 그림 6-1과 같은 곡선을 그려 보십시오.'));
body.push(NUM('참조해 재현: ogs1/README.md의 절차로 기준 케이스를 직접 돌리고 compare.py로 수두 RMS 0.13 m를 재현하십시오(약 7분).'));

/* ───────────── 11 ───────────── */
body.push(H1('11. 기호표'));
body.push(table(['기호', '의미', '단위', '기본값'], [
  ['q, v', 'Darcy 속도, 공극 속도 (v = q/φ)', 'm/d', '—'],
  ['K, k, T', '수리전도도, 고유투수율, 투수량계수 (T = KB)', 'm/d, m², m²/d', '1, 1.18e-12, 8'],
  ['h, p, z', '수두, 압력, 표고', 'm, Pa, m', '—'],
  ['φ, θ, θ_s, θ_r, S_e', '공극률, 함수비, 포화·잔류 함수비, 유효포화도', '—', '0.30 (패턴)'],
  ['B', '피압대수층 두께', 'm', '8'],
  ['i', '지역 지하수 경사', '—', '0.002'],
  ['Q, β', '정호 유량, bleed', 'm³/d, —', '100, 0.05'],
  ['s, n', '정호 간격, 패턴 규모', 'm, —', '50, 2'],
  ['C, c_inj', '농도, 주입 농도', 'mol/m³', '250'],
  ['α_L, α_T, D_m', '종·횡 분산도, 분자확산계수', 'm, m, m²/s', '2, 0.2, 1e-9'],
  ['S, M_l, M_r', '셀 흡착 RE, 침출액, 용존 RE 몰수', 'mol', '—'],
  ['k_r, K_H', '반응 속도상수, 반포화 농도', '1/d, mol/m³', '0.30, 40'],
  ['g, ρ_b', '품위, 건조 밀도', '% REO, kg/m³', '0.05, 1900'],
  ['w, w_s, w_r', '셀 물 높이, 포화·잔류 물 높이 (θ·Δz)', 'm', '—'],
  ['η', '집액 효율', '—', '0.55 (+대책)'],
  ['F, c, φ, u, W', '안전율, 점착력, 마찰각, 간극수압, 절편 중량', '—, kPa, °, kPa, kN/m', '—'],
  ['Δx, Δt, ω', '격자 간격, 시간 단계, SOR 완화계수', 'm, d, —', '3.6, ~0.2, 1.82'],
  ['PV', '공극체적 (광체 범위)', 'm³', '—'],
  ['UCL', '감시정 상한관리기준 (c/c_inj)', '—', '0.03']], [2000, 3800, 1700, 1500]));
body.push(SP());

/* ───────────── 12 ───────────── */
body.push(H1('12. 참고문헌'));
const REFS = [
  'Bear, J. (1972). Dynamics of Fluids in Porous Media. American Elsevier. — 분산 텐서(식 7).',
  'Bishop, A. W. (1955). The use of the slip circle in the stability analysis of slopes. Géotechnique 5(1), 7–17. — 식 (12).',
  'Campbell, G. S. (1974). A simple method for determining unsaturated conductivity from moisture retention data. Soil Science 117(6), 311–314. — K ∝ S_e^n 계열.',
  'Yuan, W. et al. (2025). 이온흡착형 희토류 광상 현장침출의 수리지질 특성 (프로젝트 업로드 문헌). — 층별 K, 침출 거동.',
  'Kolditz, O., Bauer, S., Bilke, L., et al. (2012). OpenGeoSys: an open-source initiative for numerical simulation of thermo-hydro-mechanical/chemical (THM/C) processes in porous media. Environmental Earth Sciences 67, 589–599.',
  'OpenGeoSys 6 Documentation — ComponentTransport (HC) process, numerical stabilization, source terms. https://www.opengeosys.org/docs/ (6.5.x).',
  'IAEA (2016). In Situ Leach Uranium Mining: An Overview of Operations. IAEA Nuclear Energy Series NF-T-1.4. — 패턴식 ISR 운영·봉쇄·복원.',
  'U.S. NRC (2009). Generic Environmental Impact Statement for In-Situ Leach Uranium Milling Facilities, NUREG-1910. — 감시정·UCL 절차.',
  'Stantec / de la Vergne, J. (2003). Hard Rock Miner\'s Handbook. — 프로젝트 지식 문서.',
  'Dougherty, H. N. (ed.). SME Mining Reference Handbook (2nd ed.). — 프로젝트 지식 문서.',
  'Chi, R., Tian, J. (2008). Weathered Crust Elution-Deposited Rare Earth Ores. Nova Science. — 이온흡착형 광상 침출 화학.',
  'ogs1/COMPARE.md, ogs1/README.md (이 저장소). — 비교 원자료·결함 기록·재현 절차.'];
REFS.forEach(r => body.push(new Paragraph({ spacing: { after: 80, line: 300 }, indent: { left: 360, hanging: 360 }, children: [new TextRun({ text: r, font: FONT, size: 19 })] })));

/* ───────────── 문서 ───────────── */
const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: FONT, color: '1a1a1a' }, paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, font: FONT, color: '2b2b2b' }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, font: FONT, color: '3a3a3a' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } }] },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
                                 { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 270 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1200, left: 1400, right: 1400 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'ISL Studio 기술 배경서 · v1.0', font: FONT, size: 16, color: '888888' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '888888' })] })] }) },
    children: body }]
});
Packer.toBuffer(doc).then(b => { const out = path.join(ROOT, 'docs', 'ISL-Studio-Technical-Background.docx'); fs.writeFileSync(out, b); console.log('docx written', out, b.length); });
