// ============================================
// 운명의 책 — Frontend logic
// ============================================

// 18문항: 일반 성격 테스트 형식. AI가 답변을 해석해서 판타지 캐릭터로 변환함.
// 점수 계산 없이 (질문, 답변) 텍스트가 통째로 백엔드 프롬프트로 전달됨.
const QUESTIONS = [
  // 개인지향 ↔ 사회지향
  { text: '휴가나 여행을 떠난다면, 당신에게 가장 끌리는 방식은?', choices: [
    '혼자 조용히, 누구의 발자국도 따라가지 않는 길로',
    '가까운 한두 명과 차분하게',
    '적당한 일행을 만나며, 한 잔 나누는 식으로',
    '많은 사람들과 떠들썩하게 어울리며',
  ]},

  // 진지함 ↔ 가벼움
  { text: '친한 사람이 무거운 표정으로 인생 이야기를 꺼낸다. 당신은?', choices: [
    '같이 무거운 얼굴로 끝까지 듣는다',
    '진심으로 들어주되, 짧게 한두 마디 보탠다',
    '듣다가 분위기를 풀어주는 농담을 던진다',
    '"에이, 그러지 말고 한잔 하자"고 잘라낸다',
  ]},

  // 공격적 ↔ 방어적
  { text: '치열한 경쟁이나 다툼 상황 앞에 섰다. 당신의 자세는?', choices: [
    '먼저 치고 나간다. 기선 제압이 전부다',
    '약점을 노려 빠르게 앞선다',
    '자세를 다지며 흐름을 본다',
    '끝까지 자리를 지키고 결정적 한 수를 본다',
  ]},

  // 행복함 ↔ 우울함
  { text: '하루를 마치고 잠자리에 들기 전, 당신의 마지막 생각은 보통?', choices: [
    '오늘 하루도 충분히 좋았다',
    '내일은 또 무슨 좋은 일이 있을까',
    '오늘 했던 한 가지가 자꾸 마음에 걸린다',
    '왜 사는 걸까, 가끔 그런 생각이 든다',
  ]},

  // 헌신적 ↔ 자주적
  { text: '당신은 속한 직장이나 모임에서 어떤 사람인가?', choices: [
    '그곳을 위해 진심으로 헌신하는 사람',
    '사람들을 위해 무언가 해주고 싶은 사람',
    '동등한 동료로 일하는 사람',
    '어디에도 깊이 매이지 않는 사람',
  ]},

  // 자신감
  { text: '누군가 당신에게 중요한 책임을 맡기려 한다. 첫 반응은?', choices: [
    '"내가 안 하면 누가 하겠어." 망설임 없이 받아들인다',
    '"한 번 해보겠다." 차분하게 받는다',
    '"왜 하필 내게?"부터 묻는다',
    '"다른 사람을 찾는 게 나을 거야." 사양한다',
  ]},

  // 계산적 ↔ 직관적
  { text: '새로운 일이나 도전을 시작할 때 당신의 방식은?', choices: [
    '일단 뛰어들어서 부딪쳐가며 배운다',
    '큰 틀만 잡고 곧장 시작한다',
    '필요한 정보와 준비를 챙긴 뒤 시작한다',
    '충분히 조사하고 계획을 세운 뒤에 시작한다',
  ]},

  // 밝음 ↔ 어두움
  { text: '비가 그친 새벽, 안개 낀 거리를 혼자 걷는다. 어떤 기분이 드는가?', choices: [
    '새 하루가 시작되는 것 같아 설렌다',
    '조용한 거리가 마음을 차분하게 한다',
    '안개 너머 보이지 않는 것들이 자꾸 신경 쓰인다',
    '누군가 따라오는 듯한 느낌이 든다',
  ]},

  // 미래지향 ↔ 현재지향
  { text: '기대치 못한 큰 돈이 손에 들어왔다. 어떻게 쓰겠는가?', choices: [
    '미래를 위해 투자하거나 저축한다',
    '일부는 저축하고 일부는 쓴다',
    '친구들과 좋은 시간 보내는 데 쓴다',
    '그날 안에 다 써버린다. 내일은 또 벌면 된다',
  ]},

  // 이기적 ↔ 이타적
  { text: '마지막 남은 음식 한 그릇이 있다. 옆에는 굶주린 사람이 보인다.', choices: [
    '내가 먼저 먹는다. 살아남아야 누구든 도울 수 있다',
    '절반을 떼어 나눈다',
    '한 입만 먹고 나머지를 건넨다',
    '통째로 건넨다. 한 끼 거른다고 죽지 않는다',
  ]},

  // 감정적 ↔ 논리적
  { text: '중요한 결정을 내려야 한다. 마음과 머리가 서로 다른 답을 내놓는다.', choices: [
    '마음을 따른다. 결국 마음이 옳다',
    '마음을 따르되, 왜 그런지 잠깐 따져본다',
    '사실과 가능성을 정리한 뒤 결정한다',
    '머리를 따른다. 감정은 사람을 그르친다',
  ]},

  // 신뢰 ↔ 의심
  { text: '한 번 만난 사람이 "우리는 같은 편이야"라며 손을 내민다.', choices: [
    '그 말을 그대로 믿는다. 사람 말은 일단 듣는다',
    '친근하게 굴면서도 마음 한 켠은 닫아둔다',
    '왜 그런 말을 하는지부터 의심한다',
    '자리를 떠난다. 가까이 오는 사람은 위험하다',
  ]},

  // 추상적 ↔ 감각적
  { text: '누군가 "그때 그건 어떤 경험이었어?"라고 묻는다.', choices: [
    '그 일이 내게 어떤 의미였는지부터 설명한다',
    '그때 어떤 생각이 들었는지 말한다',
    '무엇을 보고 들었는지 묘사한다',
    '그 순간의 냄새, 온도, 감촉까지 되살려낸다',
  ]},

  // 보수적 ↔ 진보적
  { text: '오랜 관습이 점점 의미를 잃어간다는 말이 돈다. 당신의 생각은?', choices: [
    '그래도 오랜 관습은 지킬 가치가 있다',
    '본래 뜻을 되살릴 방법을 찾는다',
    '시대에 맞게 고쳐가야 한다',
    '의미를 잃은 건 과감히 버린다. 새것이 답이다',
  ]},

  // 쾌락지향 ↔ 쾌락통제
  { text: '오늘 밤 즐길 자리가 있다. 다만 내일 아침 중요한 일이 있다.', choices: [
    '오늘은 오늘, 내일은 내일이다. 끝까지 즐긴다',
    '즐기되 적당한 선에서 마무리한다',
    '잠깐만 들렀다 일찍 일어선다',
    '가지 않는다. 내일이 더 중요하다',
  ]},

  // 명예/허세 ↔ 겸손
  { text: '당신을 크게 인정하는 자리가 마련된다고 한다.', choices: [
    '좋다. 인정받는 건 멋진 일이다',
    '받되, 너무 떠벌리지 않게 조용히',
    '거절한다. 부담스럽다',
    '자리 직전에 슬그머니 사라진다',
  ]},

  // 자유적 ↔ 규범적
  { text: '옳다고 믿는 일이 법에 어긋난다는 걸 알게 됐다.', choices: [
    '옳은 걸 한다. 법은 사람이 만든 것일 뿐이다',
    '들키지 않게 한다',
    '합법적인 다른 방법을 찾아본다',
    '법은 지킨다. 다른 길로 옳음을 추구한다',
  ]},

  // 지식추구 ↔ 실행추구
  { text: '한 평생의 시간을 어떻게 쓸 것인가?', choices: [
    '책과 사색에 잠겨 모든 것을 이해하는 데',
    '한 분야를 깊이 연구하며 진리에 다가가는 데',
    '발로 뛰며 세상을 직접 경험하는 데',
    '매일 새로운 일을 벌이며 손에 익혀가는 데',
  ]},
];

const MARKS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
const JOURNEY_MARKS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

// ============================================
// STATE
// ============================================
let currentQ = 0;
const responses = []; // [{question, answer}, ...]

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
  responses.length = 0;
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
    btn.textContent = c;
    btn.addEventListener('click', () => chooseAnswer(c));
    choicesEl.appendChild(btn);
  });
}

function chooseAnswer(answerText) {
  // 중복 클릭 방지
  document.querySelectorAll('#qChoices .choice').forEach(b => b.disabled = true);

  const q = QUESTIONS[currentQ];
  responses.push({
    question: q.text,
    choices: [...q.choices],   // 선택지 4개 전부
    selected: answerText,      // 그 중 사용자가 고른 것
  });
  currentQ++;

  if (currentQ >= QUESTIONS.length) {
    submitToAPI();
  } else {
    setTimeout(() => renderQuestion(), 180);
  }
}

// ============================================
// API CALL
// ============================================
async function submitToAPI() {
  show('screen-loading');

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses }),
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
  document.getElementById('rRace').textContent = data.race || '';
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
// ESM 동적 import 방식. esm.run이 npm 패키지를 ESM으로 변환해서 제공.
// UMD 글로벌 이름·번들 경로 문제를 우회.
let _msCache = null;
async function loadScreenshotLib() {
  if (_msCache) return _msCache;
  try {
    _msCache = await import('https://esm.run/modern-screenshot@4.6.8');
    return _msCache;
  } catch (e) {
    throw new Error('스크린샷 라이브러리 로드 실패: ' + (e.message || e));
  }
}

// 캡쳐 전 사용 폰트 명시적 로딩
async function preloadFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load('400 16px "Noto Serif KR"'),
      document.fonts.load('500 16px "Noto Serif KR"'),
      document.fonts.load('700 16px "Noto Serif KR"'),
      document.fonts.load('700 24px "Nanum Myeongjo"'),
      document.fonts.load('800 36px "Nanum Myeongjo"'),
      document.fonts.load('600 12px "Cinzel"'),
      document.fonts.load('700 16px "Cinzel"'),
    ]);
    await document.fonts.ready;
  } catch (e) {
    console.warn('Font preload partial fail:', e);
  }
}

async function captureBookAsBlob() {
  const book = document.querySelector('.book');

  book.classList.add('capturing');
  await preloadFonts();
  await new Promise(r => setTimeout(r, 250));

  const ms = await loadScreenshotLib();

  if (typeof ms.domToBlob !== 'function') {
    book.classList.remove('capturing');
    throw new Error('domToBlob 함수가 모듈에 없습니다. 사용 가능: ' + Object.keys(ms).join(', '));
  }

  let blob;
  try {
    blob = await ms.domToBlob(book, {
      scale: 2,
      backgroundColor: '#ead4a8',
      type: 'image/png',
      style: {
        background: '#ead4a8',
        backgroundImage: 'none',
        boxShadow: '0 0 0 6px #4a1316, 0 0 0 7px #8a6b3a',
      },
    });
    if (!blob || blob.size === 0) {
      throw new Error('생성된 이미지가 비어있습니다.');
    }
  } finally {
    book.classList.remove('capturing');
  }

  return blob;
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
      const blob = await captureBookAsBlob();
      downloadBlob(blob, getFilename());
    } catch (e) {
      console.error(e);
      alert(`이미지 저장 오류\n\n${e.name || 'Error'}: ${e.message || e}\n\n(이 메시지를 그대로 알려주시면 디버깅에 도움됩니다)`);
    }
  });
}

async function shareResult() {
  const btn = document.getElementById('btn-share');
  await withButtonLoading(btn, '준비 중...', async () => {
    try {
      const blob = await captureBookAsBlob();
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
      alert(`공유 오류\n\n${e.name || 'Error'}: ${e.message || e}`);
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
