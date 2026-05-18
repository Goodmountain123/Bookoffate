// ============================================
// 운명의 책 — Frontend logic
// ============================================

// 18문항: 일반 성격 테스트 형식. AI가 답변을 해석해서 판타지 캐릭터로 변환함.
// 점수 계산 없이 (질문, 답변) 텍스트가 통째로 백엔드 프롬프트로 전달됨.
const QUESTIONS = [
  // 개인지향 ↔ 사회지향
  { text: '여행을 떠난다면, 함께 가고 싶은 사람은?', choices: [
    '혼자 조용히, 자유롭게 떠난다',
    '사랑하는 사람과 단 둘이 떠난다',
    '세 명의 친구들과 즐겁게 떠난다',
    '최대한 많은 사람들과 떠나, 여행지에서 많은 사람들을 만난다',
  ]},

  // 진지함 ↔ 가벼움
  { text: '친한 사람이 무거운 표정으로 인생 이야기를 꺼낸다. 당신은?', choices: [
    '가만히 이야기를 듣고 공감해준다',
    '경험에 비춘 조언을 해준다',
    '듣다가 분위기를 풀어주는 농담을 던진다',
    '"에이, 그러지 말고 한잔 하자"고 잘라낸다',
  ]},

  // 공격적 ↔ 방어적
  { text: '가장 함께 일하고 싶은 사람은?', choices: [
    '일처리는 조금 미숙해도 진실되고 성실한 후배',
    '노련하고 일머리가 좋지만 자기 잇속을 빠짐없이 챙기는 후배',
    '다정하고 잘 챙겨주는 선배',
    '나를 향상시켜줄 엄격한 선배',
  ]},

  // 행복함 ↔ 우울함
  { text: '하루를 마치고 잠자리에 들기 전, 당신의 마지막 생각은 보통?', choices: [
    '오늘도 정말 즐거운 날이었다',
    '내일 또 출근이라니, 끔찍하다',
    '내일은 아침에 운동을 하고, 도서관에 들러야겠다',
    '사자와 호랑이는 서로 소통할 수 있을까?',
  ]},

  // 헌신적 ↔ 자주적
  { text: '당신은 속한 직장이나 모임에서 어떤 사람인가?', choices: [
    '조용하고 묵묵히 일하는 사람',
    '언제나 화제의 중심이 되는 재미있는 사람',
    '조직을 위해 진지하게 고민하는 사람',
    '조직의 틀을 깨는 창의적인 사람',
  ]},

  // 자신감
  { text: '갑자기 내일 오전에 약속이 잡힌다면 당신의 반응은?', choices: [
    '갑작스런 일정은 싫다. 거절한다',
    '부담스럽고 내키지는 않지만 일단 간다',
    '시간이 난다면 기꺼이 간다',
    '대환영이다. 마침 심심했는데 오늘 만나는 건 안되나?',
  ]},

  // 계산적 ↔ 직관적
  { text: '새로운 일이나 도전을 시작할 때 당신의 방식은?', choices: [
    '일단 뛰어들어서 부딪쳐가며 배운다',
    '큰 틀만 잡고 곧장 시작한다',
    '필요한 정보와 준비를 챙긴 뒤 시작한다',
    '충분히 조사하고 계획을 세운 뒤에 시작한다',
  ]},

  // 밝음 ↔ 어두움
  { text: '누군가 당신의 뒷담화를 한 것을 알게 되었다. 당신의 반응은?', choices: [
    '나도 그 사람의 뒷담화를 한다',
    '자신이 무엇을 잘못했는지 곰곰히 생각한다',
    '당사자를 찾아가 조심스럽게 오해를 풀어본다',
    '당사자를 찾아가 직접적으로 따진다',
  ]},

  // 미래지향 ↔ 현재지향
  { text: '갑작스럽게 여윳돈이 손에 들어왔다. 어떻게 쓰겠는가?', choices: [
    '미래를 위해 저축한다',
    '듣고 싶었던 온라인 클래스를 듣는다',
    '가족들을 위한 선물을 산다',
    '사고 싶었던 것을 산다',
  ]},

  // 이기적 ↔ 이타적
  { text: '추운 겨울, 길거리에서 구걸하는 사람이 있다. 어떻게 하겠는가?', choices: [
    '만원짜리 지폐를 건네준다',
    '따뜻한 핫팩을 사서 건넨다',
    '마음은 돕고 싶지만, 왠지 돕지 못한다.',
    '무조건적인 적선은 위선이다. 아무것도 하지 않는다',
  ]},

  // 감정적 ↔ 논리적
  { text: '물건을 살 때 결정하는 방법은?', choices: [
    '내 마음에 드는게 제일 중요하다. 느낌을 따라간다',
    '마음에 드는 것을 찾되, 장단점을 살펴본다',
    '지금 내 경제상황을 고려해서 가격에 맞춰 산다',
    '장단점과 가격, 성능 등을 꼼꼼히 비교해서 결정한다',
  ]},

  // 신뢰 ↔ 의심
  { text: '세상은 무엇으로 이루어져있는가?', choices: [
    '세상은 사랑과 영혼, 정신으로 이루어진다',
    '세상은 사람과 사건, 이야기로 이루어진다',
    '세상은 물질과 현상, 실질로 이루어진다',
    '딱히 그런 생각은 하지 않는다',
  ]},

  // 추상적 ↔ 감각적
  { text: '내일 중요한 일이 있다. 그런데 오늘 친구가 멀리 떠나기 전 마지막 날이다.', choices: [
    '일은 다시 오지만 오늘 밤은 하루 뿐이다. 친구와 성대하게 파티를 한다',
    '친구의 앞날을 축복하며 함께 시간을 보낸다. 적당히 즐기고 내일을 준비한다',
    '친구에게 따뜻한 작별인사를 보낸다. 내일을 준비한다.',
    '떠나는 친구는 떠날 뿐이다. 중요한 일에 집중한다',
  ]},

  // 보수적 ↔ 진보적
  { text: '인적 드문 시골길, 당신은 신호등 빨간 불 앞에 서있다', choices: [
    '깡촌에 무슨 신호등인가. 그냥 건넌다.',
    '조금 기다려보고 차가 없으면 건넌다.',
    '규칙은 규칙. 신호는 반드시 지켜야한다',
    '혹시 사고가 나면 책임을 따져야 한다. 초록 불에 건넌다.',
  ]},

  // 쾌락지향 ↔ 쾌락통제
  { text: '믿을만한 사람이, 인생에 다시는 없을 끝내주는 경험을 시켜주겠다고 한다', choices: [
    '망설일 필요 없다. 인생은 한 번 뿐이다',
    '한번 믿어본다. 새로운 경험은 필요하다.',
    '무슨 일인지 자세히 들어보고 결정하겠다고 한다',
    '의심스럽다. 거절한다',
  ]},

  // 명예/허세 ↔ 겸손
  { text: '다음 시계 중 하나를 공짜로 얻을 수 있다면?', choices: [
    '초고가의 명품 브랜드 시계',
    '세상에 하나뿐인, 내 마음에 쏙 드는 장인제작 시계',
    '과거의 유명인이 차던 역사의 혼이 담긴 유물시계',
    '온갖 최첨단 기능을 갖춘 최첨단 시계',
  ]},

  // 자유적 ↔ 규범적
  { text: '옳다고 믿는 일이 법에 어긋난다는 걸 알게 됐다.', choices: [
    '옳은 걸 한다. 법은 사람이 만든 것일 뿐이다',
    '법을 바꾸자고 항의한다',
    '합법적인 다른 방법을 찾아본다',
    '법은 법이다. 안타깝지만 법대로 한다',
  ]},

  // 지식추구 ↔ 실행추구
  { text: '당신은 검술을 배우고 있다. 어떤 책에 가장 끌리는가?', choices: [
    '역사 속 전설적인 검술가들의 이야기',
    '검술 실전 전술 교범',
    '검술에 얽힌 철학/인문학 책',
    '책 읽을 시간에 훈련을 한다',
  ]},
];

const MARKS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
const JOURNEY_MARKS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

// ============================================
// STATE
// ============================================
let currentQ = 0;
const responses = []; // [{question, choices, selected}, ...]
let selectedGender = 'm';   // 'm' or 'f' — 시작 화면에서 사용자가 선택

// ============================================
// RACE → 초상화 이미지 매핑
// 종족명에 포함된 키워드로 이미지 파일명 결정.
// 매칭 순서 중요: 긴 복합어를 먼저 (e.g. "하프오크" before "오크")
// 일부 종족은 한쪽 성별만 있음 → genders 배열로 명시, 없으면 가용한 성별로 폴백
// ============================================
const RACE_TO_IMAGE = [
  // [matcher, image_key, available_genders?]
  // -- 긴 복합어 먼저
  ['하프오크',     'halforc'],
  ['산악 드워프', 'mountaindwarf'],
  ['하이엘프',     'highelf'],
  ['우드엘프',     'woodelf'],
  ['다크엘프',     'darkelf'],
  ['복제인간',     'synth'],     // 복제 → synth; "인간" 매칭보다 먼저
  ['합성생명체',   'synth'],     // 합성생명체도 같은 synth 이미지
  ['외계인',       'alien'],
  // -- 단일어
  ['엘프',         'darkelf'],   // 기타 엘프 변형 폴백
  ['드워프',       'dwarf'],
  ['하플링',       'halfling'],
  ['노움',         'gnome'],
  ['오크',         'orc'],
  ['고블린',       'goblin'],
  ['수인',         'beast'],
  ['드래곤',       'dragon'],
  ['티플링',       'tifling'],
  ['마족',         'devil'],
  ['안드로이드',   'droid'],
  ['인어',         'mermaid'],
  ['뱀파이어',     'vampire'],
  ['언데드',       'undead'],
  ['인간',         'human'],            // 마지막 (다른 종족명에 '인'이 포함될 수 있음)
];

function resolveRaceImage(race, gender) {
  if (!race) return '';
  for (const entry of RACE_TO_IMAGE) {
    const [matcher, key, availableGenders] = entry;
    if (race.includes(matcher)) {
      // 가용 성별 체크 — 없으면 가용한 쪽으로 폴백
      const useGender = (!availableGenders || availableGenders.includes(gender))
        ? gender
        : availableGenders[0];
      return `portraits/${key}_${useGender === 'f' ? 'f' : 'm'}.png`;
    }
  }
  return ''; // 매칭 안되면 빈 문자열 (CSS에서 hide)
}

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
      body: JSON.stringify({ responses, gender: selectedGender }),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) { throw new Error(`서버 응답을 해석할 수 없습니다: ${text.slice(0, 200)}`); }

    if (!resp.ok) {
      throw new Error(data.error || `서버 오류 (${resp.status})`);
    }

    if (data._debug) logDebugInfo(data._debug);

    renderResult(data);
  } catch (err) {
    console.error(err);
    showError(err.message || '알 수 없는 오류가 발생했습니다.');
  }
}

// ============================================
// DEBUG — 1차 API 분석 결과 콘솔 출력
// ============================================
function logDebugInfo(debug) {
  const a = debug.personalityAnalysis || {};

  console.group('%c🔮 운명의 서 — 디버그 정보',
    'background:#4a1316;color:#e9d5a8;font-weight:bold;padding:4px 10px;border-radius:3px;');

  console.log('%c[성별]', 'color:#b89456;font-weight:bold;', debug.gender);
  console.log('%c[영감 클래스 후보]', 'color:#b89456;font-weight:bold;', debug.inspirationClasses);
  console.log('%c[영감 종족 후보]', 'color:#b89456;font-weight:bold;', debug.inspirationRaces);

  console.log('%c[Step 1] 성격 키워드',
    'color:#4a1316;font-weight:bold;');
  console.log(a.summary || '(없음)');

  console.log('%c원본 객체:', 'color:#888;font-style:italic;', a);

  console.groupEnd();
}

// ============================================
// RENDER RESULT
// ============================================
function renderResult(data) {
  // 초상화 (클래스명 위)
  const portraitEl = document.getElementById('rPortrait');
  const portraitSrc = resolveRaceImage(data.race, selectedGender);
  if (portraitSrc) {
    portraitEl.src = portraitSrc;
    portraitEl.alt = `${data.race || ''} 초상화`;
  } else {
    portraitEl.removeAttribute('src');
    portraitEl.alt = '';
  }

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
        text: '이세계 속 당신의 운명입니다.  - ARTAKUS- ',
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

  // 성별 선택 토글
  document.querySelectorAll('.gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gender-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      selectedGender = btn.dataset.gender;
    });
  });
});
