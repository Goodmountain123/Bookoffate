// ============================================
// 운명의 책 — Frontend logic
// ============================================

// 9개 성격 축
const AXES = [
  { left: '개인지향', right: '사회지향' },
  { left: '헌신적',   right: '자주적' },
  { left: '직관적 해결', right: '신중한 설계' },
  { left: '갈등 충돌', right: '회피' },
  { left: '미래지향', right: '현재지향' },
  { left: '현실적',   right: '이상적' },
  { left: '추상적',   right: '감각적' },
  { left: '쾌락지향', right: '쾌락통제' },
  { left: '자유적',   right: '규범적' },
];

// 18문항: 각 축당 2문항.
// score: 좌측(+2/+1), 우측(-1/-2)
const QUESTIONS = [
  // 축 0: 개인지향 ↔ 사회지향
  { axis: 0, text: '여행을 떠나야 한다. 당신이 가장 끌리는 길은?', choices: [
    { text: '도시 밖 언덕길, 누구의 발자국도 따라가지 않는 길', score: +2 },
    { text: '친한 한두 명과 조용히 걷는 길', score: +1 },
    { text: '가끔 동행을 만나도 좋고, 술집에서 한 잔 나누는 길', score: -1 },
    { text: '동료들과 마차를 타고 떠들썩하게 가는 길', score: -2 },
  ]},
  { axis: 0, text: '큰 도시에 막 도착했다. 가장 먼저 들르고 싶은 곳은?', choices: [
    { text: '도시 밖 바람 잘 드는 언덕', score: +2 },
    { text: '외곽의 조용한 여관', score: +1 },
    { text: '길드 게시판이 있는 정보 시장', score: -1 },
    { text: '사람으로 북적이는 광장의 술집', score: -2 },
  ]},

  // 축 1: 헌신적 ↔ 자주적
  { axis: 1, text: '당신의 검을 휘두르는 이유에 가장 가까운 것은?', choices: [
    { text: '지키기로 한 누군가가 있기 때문에', score: +2 },
    { text: '내가 속한 무리를 위해', score: +1 },
    { text: '내 신념과 자존심을 지키기 위해', score: -1 },
    { text: '누구의 깃발도 들지 않은, 오직 나 자신의 결정으로', score: -2 },
  ]},
  { axis: 1, text: '한 영주가 평생의 충성을 요구하며 큰 보수를 제안한다.', choices: [
    { text: '받아들인다. 충성할 대상이 있다는 건 좋은 일이다', score: +2 },
    { text: '그 영주의 사람들을 위해서라면 일할 수 있다', score: +1 },
    { text: '동등한 동료로 일하겠다고 협상한다', score: -1 },
    { text: '거절한다. 누구의 부하도 되지 않는다', score: -2 },
  ]},

  // 축 2: 직관적 해결 ↔ 신중한 설계
  { axis: 2, text: '미지의 던전 입구에 섰다. 당신은?', choices: [
    { text: '일단 들어가서 부딪쳐 본다. 길은 가다 보면 안다', score: +2 },
    { text: '입구 근처를 한 번 훑어보고 곧장 들어간다', score: +1 },
    { text: '횃불·식량·약초를 챙긴 뒤 들어간다', score: -1 },
    { text: '던전의 역사와 과거 탐험가의 기록까지 읽은 뒤 들어간다', score: -2 },
  ]},
  { axis: 2, text: '동료가 멀리서 위험에 빠진 게 보인다. 당신의 첫 반응은?', choices: [
    { text: '생각하기 전에 몸이 먼저 움직인다', score: +2 },
    { text: '짧게 상황을 보고 바로 뛰어든다', score: +1 },
    { text: '적의 수와 무기 배치를 빠르게 훑은 뒤 움직인다', score: -1 },
    { text: '가장 좋은 진입 시점을 기다린다', score: -2 },
  ]},

  // 축 3: 갈등 충돌 ↔ 회피
  { axis: 3, text: '누군가가 술집에서 당신을 모욕했다.', choices: [
    { text: '그 자리에서 손이 먼저 나간다', score: +2 },
    { text: '한 마디 받아치고 분위기를 잡는다', score: +1 },
    { text: '못 들은 척 흘려보낸다', score: -1 },
    { text: '자리를 떠나고, 다시는 그곳에 가지 않는다', score: -2 },
  ]},
  { axis: 3, text: '동료들 사이에 큰 의견 충돌이 일어났다.', choices: [
    { text: '내 의견을 끝까지 밀어붙인다', score: +2 },
    { text: '한쪽 편을 들고 함께 싸운다', score: +1 },
    { text: '양쪽을 중재하려 한다', score: -1 },
    { text: '침묵을 지키거나 자리를 피한다', score: -2 },
  ]},

  // 축 4: 미래지향 ↔ 현재지향
  { axis: 4, text: '큰 보상금이 손에 들어왔다. 어떻게 쓰겠는가?', choices: [
    { text: '다음 모험을 위한 장비와 식량에 투자한다', score: +2 },
    { text: '일부는 저축하고 일부는 쓴다', score: +1 },
    { text: '친구들과 한턱 거하게 쏘고 즐긴다', score: -1 },
    { text: '그날 밤 안에 다 써버린다. 내일은 또 벌면 된다', score: -2 },
  ]},
  { axis: 4, text: '당신이 가장 두려워하는 일은?', choices: [
    { text: '아무 준비 없이 갑작스러운 일이 닥치는 것', score: +2 },
    { text: '중요한 결정을 잘못 내리는 것', score: +1 },
    { text: '하고 싶은 일을 못 해본 채 늙어가는 것', score: -1 },
    { text: '오늘 하루를 후회하며 보내는 것', score: -2 },
  ]},

  // 축 5: 현실적 ↔ 이상적
  { axis: 5, text: '누군가 "세상을 더 나은 곳으로 만들자"고 말한다. 당신의 속마음은?', choices: [
    { text: '좋은 말이지만, 일단 오늘 먹을 빵부터', score: +2 },
    { text: '그러려면 구체적으로 무엇부터 해야 할까?', score: +1 },
    { text: '그 생각만으로도 마음이 움직인다', score: -1 },
    { text: '그것이야말로 내가 살아가는 이유다', score: -2 },
  ]},
  { axis: 5, text: '모두가 따르는 일에 한 사람만 "이건 잘못됐다"고 외친다.', choices: [
    { text: '모두가 따르는 데는 그만한 이유가 있을 것이다', score: +2 },
    { text: '누가 맞는지 직접 알아본다', score: +1 },
    { text: '옳다고 느끼는 쪽에 마음이 간다', score: -1 },
    { text: '모두가 틀려도 옳은 건 옳은 것이다', score: -2 },
  ]},

  // 축 6: 추상적 ↔ 감각적
  { axis: 6, text: '도서관에서 한 권만 가져갈 수 있다. 무엇을 고르겠는가?', choices: [
    { text: '고대 룬과 우주의 원리에 관한 두꺼운 사색서', score: +2 },
    { text: '전설과 신화를 모아놓은 이야기책', score: +1 },
    { text: '실전 전투술과 무기 도감', score: -1 },
    { text: '각 지역의 풍경·음식·사람들을 담은 여행기', score: -2 },
  ]},
  { axis: 6, text: '누군가 "그때 그건 어떤 경험이었어?"라고 묻는다.', choices: [
    { text: '그 일이 내게 어떤 의미였는지부터 설명한다', score: +2 },
    { text: '그때 어떤 생각이 들었는지 말한다', score: +1 },
    { text: '무엇을 보고 들었는지 묘사한다', score: -1 },
    { text: '그 순간의 냄새, 온도, 감촉까지 되살려낸다', score: -2 },
  ]},

  // 축 7: 쾌락지향 ↔ 쾌락통제
  { axis: 7, text: '오늘 밤 술집에 갈 시간이 있다. 다만 내일 아침 중요한 일이 있다.', choices: [
    { text: '오늘은 오늘, 내일은 내일이다. 끝까지 마신다', score: +2 },
    { text: '즐기되 적당한 선에서 끊는다', score: +1 },
    { text: '한두 잔만 마시고 일찍 일어선다', score: -1 },
    { text: '일찍 잠자리에 든다. 내일이 더 중요하다', score: -2 },
  ]},
  { axis: 7, text: '사람들이 당신을 어떻게 부르는가?', choices: [
    { text: '"참는 법을 모르는 사람" — 인생은 한 번뿐이니까', score: +2 },
    { text: '"즐길 줄 아는 사람" — 후회 없이 산다', score: +1 },
    { text: '"분별 있는 사람" — 가끔은 참고, 가끔은 풀어준다', score: -1 },
    { text: '"절제할 줄 아는 사람" — 욕망을 다스리는 법을 일찍 배웠다', score: -2 },
  ]},

  // 축 8: 자유적 ↔ 규범적
  { axis: 8, text: '옳다고 믿는 일이 법에 어긋난다는 걸 알게 됐다.', choices: [
    { text: '옳은 걸 한다. 법은 사람이 만든 것일 뿐이다', score: +2 },
    { text: '들키지 않게 한다', score: +1 },
    { text: '합법적인 다른 방법을 찾아본다', score: -1 },
    { text: '법은 지킨다. 다른 길로 옳음을 추구한다', score: -2 },
  ]},
  { axis: 8, text: '길드가 "이건 우리의 오랜 전통이니 반드시 따라야 한다"고 한다.', choices: [
    { text: '의미 없다고 느끼면 그냥 따르지 않는다', score: +2 },
    { text: '마음에 안 들어도 자기 방식으로 비틀어서 한다', score: +1 },
    { text: '따르되, 그 의미를 묻고 기록한다', score: -1 },
    { text: '전통에는 따를 만한 이유가 있다. 그대로 따른다', score: -2 },
  ]},
];

const MARKS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
const JOURNEY_MARKS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

// ============================================
// STATE
// ============================================
let currentQ = 0;
const scores = new Array(9).fill(0);

// ============================================
// SCREEN NAV
// ============================================
function show(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// QUIZ FLOW
// ============================================
function startQuiz() {
  currentQ = 0;
  scores.fill(0);
  show('screen-quiz');
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[currentQ];
  document.getElementById('qPage').textContent = `PAGE ${currentQ + 1} / 18`;
  document.getElementById('qProgress').style.width = `${((currentQ + 1) / 18) * 100}%`;
  document.getElementById('qText').textContent = q.text;

  const choicesEl = document.getElementById('qChoices');
  choicesEl.innerHTML = '';
  q.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.type = 'button';
    btn.setAttribute('data-mark', MARKS[i]);
    btn.textContent = c.text;
    btn.addEventListener('click', () => chooseAnswer(c.score, btn));
    choicesEl.appendChild(btn);
  });
}

function chooseAnswer(score, clickedBtn) {
  // 중복 클릭 방지
  document.querySelectorAll('#qChoices .choice').forEach(b => b.disabled = true);

  scores[QUESTIONS[currentQ].axis] += score;
  currentQ++;

  if (currentQ >= QUESTIONS.length) {
    submitToAPI();
  } else {
    // 살짝 딜레이 후 다음 문항 (페이지 넘어가는 느낌)
    setTimeout(() => renderQuestion(), 180);
  }
}

// ============================================
// SCORE → LABEL
// ============================================
function toLabel(score, axis) {
  if (score >= 3)  return `강한 ${axis.left}`;
  if (score >= 1)  return `약한 ${axis.left}`;
  if (score === 0) return `중립`;
  if (score >= -2) return `약한 ${axis.right}`;
  return `강한 ${axis.right}`;
}

function buildProfile() {
  return scores.map((s, i) => ({
    axis: `${AXES[i].left} ↔ ${AXES[i].right}`,
    label: toLabel(s, AXES[i]),
    raw: s,
  }));
}

// ============================================
// API CALL
// ============================================
async function submitToAPI() {
  show('screen-loading');
  const profile = buildProfile();

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) { throw new Error(`서버 응답을 해석할 수 없습니다: ${text.slice(0, 200)}`); }

    if (!resp.ok) {
      throw new Error(data.error || `서버 오류 (${resp.status})`);
    }

    renderResult(data);
  } catch (err) {
    console.error(err);
    showError(err.message || '알 수 없는 오류가 발생했습니다.');
  }
}

// ============================================
// RENDER RESULT
// ============================================
function renderResult(data) {
  document.getElementById('rClass').textContent = data.className || '???';
  document.getElementById('rTagline').textContent = data.tagline || '';
  document.getElementById('rPrimary').textContent = data.weapons?.primary || '';
  document.getElementById('rSecondary').textContent = data.weapons?.secondary || '';

  const skillsEl = document.getElementById('rSkills');
  skillsEl.innerHTML = '';
  (data.skills || []).forEach(s => {
    const div = document.createElement('div');
    div.className = 'skill';
    div.textContent = s;
    skillsEl.appendChild(div);
  });

  // 특수능력
  const sa = data.specialAbility || {};
  document.getElementById('rSpecialName').textContent = sa.name || '';
  document.getElementById('rSpecialDesc').textContent = sa.description || '';

  const perksEl = document.getElementById('rPerks');
  perksEl.innerHTML = '';
  (data.perks || []).forEach(p => {
    const div = document.createElement('div');
    div.className = 'perk';

    const name = document.createElement('div');
    name.className = 'perk-name';
    name.textContent = p.name || '';

    const effects = document.createElement('div');
    effects.className = 'perk-effects';

    const pos = document.createElement('span');
    pos.className = 'perk-positive';
    pos.textContent = p.positive || '';

    const neg = document.createElement('span');
    neg.className = 'perk-negative';
    neg.textContent = p.negative || '';

    effects.appendChild(pos);
    effects.appendChild(neg);
    div.appendChild(name);
    div.appendChild(effects);
    perksEl.appendChild(div);
  });

  document.getElementById('rInterpretation').textContent = data.interpretation || '';

  // 여정 렌더링
  const journeyEl = document.getElementById('rJourney');
  journeyEl.innerHTML = '';
  (data.journey || []).forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'journey-entry';

    const mark = document.createElement('span');
    mark.className = 'journey-mark';
    mark.textContent = JOURNEY_MARKS[i] || '·';

    const text = document.createElement('span');
    text.className = 'journey-text';
    text.textContent = entry;

    row.appendChild(mark);
    row.appendChild(text);
    journeyEl.appendChild(row);
  });

  show('screen-result');
}

// ============================================
// ERROR
// ============================================
function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  show('screen-error');
}

function restart() {
  location.reload();
}

// ============================================
// SAVE / SHARE
// ============================================
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HTML2CANVAS_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('html2canvas 로드 실패'));
    document.head.appendChild(script);
  });
}

async function captureBook() {
  const book = document.querySelector('.book');

  // 캡쳐 모드 진입 (버튼 숨김 + 푸터 표시)
  book.classList.add('capturing');

  // 폰트 로드 완료 대기 + 렌더링 안정화 한 박자
  try { await document.fonts.ready; } catch (_) {}
  await new Promise(r => setTimeout(r, 120));

  await loadHtml2Canvas();

  let canvas;
  try {
    canvas = await window.html2canvas(book, {
      backgroundColor: '#15100a',
      scale: 3,                                  // 고정 3배 — 선명한 캡쳐
      useCORS: true,
      allowTaint: false,
      logging: false,
      letterRendering: true,                     // 텍스트 렌더링 품질
      imageTimeout: 0,
      windowWidth: book.scrollWidth,
      windowHeight: book.scrollHeight,
      onclone: (clonedDoc) => {
        // 캡쳐용 클론에서 텍스트 안티얼라이싱 강제
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: geometricPrecision;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });
  } finally {
    book.classList.remove('capturing');
  }

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
  });
}

function getFilename() {
  const cls = document.getElementById('rClass').textContent.trim().replace(/\s+/g, '-') || '결과';
  return `운명의-서_${cls}.png`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function withButtonLoading(btn, loadingText, fn) {
  const original = btn.textContent;
  btn.textContent = loadingText;
  btn.disabled = true;
  try {
    await fn();
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

async function saveImage() {
  const btn = document.getElementById('btn-save');
  await withButtonLoading(btn, '저장 중...', async () => {
    try {
      const canvas = await captureBook();
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, getFilename());
    } catch (e) {
      console.error(e);
      alert('이미지 저장 중 오류가 발생했어요.');
    }
  });
}

async function shareResult() {
  const btn = document.getElementById('btn-share');
  await withButtonLoading(btn, '준비 중...', async () => {
    try {
      const canvas = await captureBook();
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], getFilename(), { type: 'image/png' });

      const shareData = {
        title: '운명의 서 — 이세계의 당신',
        text: '나의 이세계 클래스가 나왔어요',
        files: [file],
      };

      // Web Share API + 파일 지원 여부 체크 (주로 모바일)
      if (navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (e) {
          // 사용자가 공유 취소한 경우는 조용히 통과
          if (e && e.name === 'AbortError') return;
          console.error('share failed, falling back:', e);
        }
      }

      // 폴백: 이미지 다운로드
      downloadBlob(blob, getFilename());
      alert('이 환경에서는 직접 공유가 안 되어 이미지로 저장했어요.\n저장된 이미지를 원하는 곳에 올려주세요.');
    } catch (e) {
      console.error(e);
      alert('공유 중 오류가 발생했어요.');
    }
  });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start').addEventListener('click', startQuiz);
  document.getElementById('btn-retry').addEventListener('click', restart);
  document.getElementById('btn-restart').addEventListener('click', restart);
  document.getElementById('btn-save').addEventListener('click', saveImage);
  document.getElementById('btn-share').addEventListener('click', shareResult);
});
