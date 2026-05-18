// ============================================
// /functions/api/chat.js
// Cloudflare Pages Function — POST /api/chat
//
// 동작 (2단계 호출):
//   1. 프론트에서 18개 (질문, 답변) 쌍을 받음
//   2. [Step 1] 답변 → 상세한 성격 분석 (MBTI 결과지 스타일, 판타지 ❌)
//   3. [Step 2] 성격 분석만 → 판타지 캐릭터 (원본 답변은 차단)
//   4. Step 2 결과를 그대로 반환
//
// 환경변수: OPENAI_API_KEY
// ============================================

const MODEL = 'gpt-5.4-mini';   // 현재 프론티어급. 비용 절감용으로 'gpt-4o-mini' 가능.
const TEMPERATURE = 1.0;

// ============================================
// 클래스 풀 — 매 호출마다 랜덤으로 일부 뽑아 영감 후보로 주입
// (모델이 항상 같은 클래스로 수렴하는 문제를 우회하기 위함)
// ============================================
const CLASS_POOL = [
  // 판타지 전투
  '북방 전사', '서리 검사', '마검사', '용기사', '여명의 기사', '결투사', '검투사',
  // 판타지 마법
  '연금술사', '룬학자', '점성술사', '강령술사', '몽환술사', '주술사', '비전 마법사',
  '엘리멘탈리스트', '시계태엽 마법사', '꿈 해독사', '천문술사', '룬 새김장',
  // 판타지 자연
  '드루이드', '늑대 영주', '바람의 무용가', '숲 정찰자', '꽃 마술사', '약초사',
  // 판타지 음악·예술
  '극장 시인', '풍금 연주가', '연극가', '도서 사서', '변사', '필경사',
  // 판타지 어둠
  '악마 사냥꾼', '뱀파이어 사냥꾼', '망령 술사', '재의 마녀', '저주 해제사',
  // 판타지 잠입
  '그림자 도적', '독사 도적', '닌자', '거리의 사기꾼', '잠입자', '암호 해독가',
  // 판타지 직업
  '용병', '현상금 사냥꾼', '밀렵꾼', '항해사', '난파선 청소부', '소금 상인',
  '연금술 상인', '주술 거래상', '외교관', '정보상', '범죄 협상가',
  // 판타지 신성
  '신탁 사제', '수도사', '순례자', '성유물 사냥꾼', '치유사',
  // SF 전투
  '바이오 사이보그', '메카 조종사', '폭파전문가', '식민지 척후병', '용병 사관',
  // SF 기술
  '해커', '사이오닉', '안드로이드 정비공', '바이오 엔지니어', '데이터 마이너',
  '시간 정정원', '신경 외과의', '드론 조련사',
  // SF 사회·정보
  '외계 종족학자', '항법사', '잠항자', '우주 해적', '바운티 헌터',
  '심리 분석가', '초능력자', '시간 여행자', '식민지 외교관',
];

function pickInspirationClasses(n = 7) {
  // Fisher-Yates 셔플의 부분 — 매 호출마다 다른 결과
  const pool = [...CLASS_POOL];
  const picked = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// ============================================
// STEP 1 — 성격 분석 (MBTI 결과지 스타일)
// ============================================
const STEP1_SYSTEM_PROMPT = `
너는 심리테스트 결과를 바탕으로 사용자의 성격을 깊이 분석하는 심리 전문가야.
주어진 18개의 문항을 종합하여, MBTI 검사 결과지처럼 상세한 성격 분석을 제공한다.

# 입력 형식
- 각 문항마다 4개의 선택지가 모두 제시된다.
- ● 표시: 사용자가 **선택한** 답
- ○ 표시: 사용자가 **선택하지 않은** 답
- 두 정보 모두 성향 분석에 중요하다. 무엇을 거절했는지도 성격을 드러낸다.
  · 예: "혼자 떠난다"를 골랐을 때 거절한 선택지가 "사랑하는 사람과 둘이"였는지 "많은 사람들과 떠들썩하게"였는지에 따라 의미가 다르다.

# 분석 방식 (★★★★★ 가장 중요)
- 각 문항의 표면적 답변에 매이지 마라. 18개 답변 전체의 **패턴**을 종합해 성격의 본질을 도출하라.
- 답변 사이의 모순도 살피고, 그 모순이 의미하는 바를 분석하라.
- 답변 텍스트를 그대로 인용하거나 복사하지 마라. 답변에서 쓰인 단어 그대로 쓰는 것 금지.
- 답변에서 드러난 상황(여행, 술자리, 신호등 등)을 그대로 분석에 쓰지 말고, 그 답변이 드러내는 **성격 차원**을 추출하라.
- **판타지/SF 색을 일절 넣지 마라.** 순수한 일반 성격 분석.

# 분석 톤
- 따뜻하고 통찰력 있는 심리분석. 진지하되 공감적.
- 사용자가 "맞아, 나 이런 면이 있어..."라며 공감할 수 있게.
- 동시에 사용자가 자기 자신에 대해 잘 모르던 면을 발견하게 만드는 의외의 통찰을 포함.
- 절대 단순한 "당신은 외향적인 사람입니다" 식의 평면적 묘사 금지. 모든 차원을 깊이 있게.

# 출력 구조
- summary: 이 사람의 핵심 본질. 한 문단(4~6문장). "당신은 ~한 사람입니다" 식으로.
- dimensions: 6~8개의 주요 성격 차원. 각각:
  · name: 차원 이름 (예: "에너지 방향", "의사결정 방식", "감정 표현", "관계 신뢰도", "변화 수용성", "자기 인식")
  · analysis: 이 차원에서 이 사람의 위치와 그 의미 (3~5문장)
- motivations: 무엇이 이 사람을 움직이는가, 무엇을 두려워하는가, 무엇을 깊이 갈망하는가 (3~5문장)
- shadow: 본인도 잘 인식하지 못하는 면, 답변에서 드러난 모순, 자기 자신에게 숨기는 그늘 (3~5문장)

모든 텍스트는 한국어.
`.trim();

const STEP1_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '핵심 본질 요약. 4~6문장.',
    },
    dimensions: {
      type: 'array',
      description: '6~8개 주요 성격 차원 분석',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '차원 이름 (예: 에너지 방향, 의사결정 방식)' },
          analysis: { type: 'string', description: '이 차원에서의 분석. 3~5문장.' },
        },
        required: ['name', 'analysis'],
        additionalProperties: false,
      },
    },
    motivations: {
      type: 'string',
      description: '동기·두려움·갈망. 3~5문장.',
    },
    shadow: {
      type: 'string',
      description: '본인이 잘 모르는 면, 모순, 그늘. 3~5문장.',
    },
  },
  required: ['summary', 'dimensions', 'motivations', 'shadow'],
  additionalProperties: false,
};

// ============================================
// STEP 2 — 판타지 캐릭터 생성 (성격 분석만 입력)
// ============================================
const STEP2_SYSTEM_PROMPT = `
너는 사용자의 성격 분석 결과를 바탕으로 그에 어울리는 판타지/SF 가상 캐릭터를 만드는 프로그램이야.

# ★★★★★ 가장 중요한 규칙
- **사용자의 원본 답변은 너에게 주어지지 않는다. 오직 성격 분석 결과만 본다.**
- 따라서 답변에서 나온 상황(검술 책, 시계, 술자리 등)을 그대로 캐릭터로 옮길 수 없다.
- 너의 일은: 성격 분석을 깊이 읽고, 그 성격을 살아 숨쉬는 캐릭터로 **형상화**하는 것.
- 캐릭터는 분석된 성격의 화신이지, 답변 단어의 직역이 아니다.

# 출력 = 클래스 + 종족 + 태그라인 + 해설 + 주무기/보조무기 + 능력 + 퍽 + 여정

# 클래스 규칙
- SF 클래스와 판타지 클래스를 적절하게 사용.
- 구체적으로 작성.
- 너무 낯선 클래스 말고 어느정도 익숙하되, 개성있는 클래스 사용.
- 유랑xxx, 성기사, 협상xxx 사용 지양.

# 클래스 다양성 (★★★★★ 매우 중요 — 진부함 차단)
- 같은 성격이라도 매번 다른 클래스로 형상화될 수 있어야 함.
- **다음 진부한 직접 매핑을 의식적으로 피하라:**
  · 지식 좋아함 → 마법사 ❌ ··· 연금술사, 사서, 점성술사, 룬학자, 수도사로
  · 행동적 → 전사 ❌ ··· 용병, 현상금 사냥꾼, 밀렵꾼, 도적, 메카 조종사로
  · 사회적 → 음유시인 ❌ ··· 외교관, 정보상, 극장 시인, 변사로
  · 정의로움 → 성기사 ❌ ··· 신탁 사제, 수도사, 악마사냥꾼으로
  · 자유로움 → 도적 ❌ ··· 우주 해적, 잠항자, 항해사, 거리의 사기꾼으로
  · 차분함 → 마법사 ❌ ··· 천문술사, 시계태엽 학자, 룬 새김장으로
- 너무 흔한 기본 클래스(검사, 마법사, 전사, 음유시인, 도적, 성기사)는 강력한 이유 없으면 회피.
- "회개한 X", "추방된 X", "은퇴한 X", "잠적한 X" 같은 수식어 변형도 좋다.
- 사용자 메시지에 제공된 "영감 후보" 클래스를 참고하라. 그 결을 따라가거나, 비슷한 다른 클래스로 응용해라.

# 종족 규칙
- 클래스와 어울리는 종족 1개.
- 같은 클래스라도 다양하게.
- 너무 낯선 종족 지양.

# 해설 작성 방식 (★★★★★ 가장 중요)
- 반드시 가장 먼저 캐릭터의 배경과 여정의 계기를 구체적·서사적으로 적을 것.
- 성격 분석에서 도출된 본질을 캐릭터의 삶의 사건으로 풀어내라.
- 성격을 구체적인 상황 예시를 들어 설명할 것. 그 상황은 판타지 세계관 안의 새로운 상황으로.
- 캐릭터 배경 예: "당신은 마족 가문의 막내로 태어나, 마족의 삶을 버리고 인간계로 도망쳤습니다."
- 여정의 계기 예: "당신은 어린 시절 아버지를 따라 나선 항해길에서의 해풍에 마음이 이끌려 여정을 시작했습니다."
- 구체적인 선호("술을 좋아한다, 음악을 좋아한다, 이종족을 혐오한다")를 포함하는 것도 좋다.
- 피검자가 자신의 새로운 이면을 발견하거나, 뜨끔하게 만드는 요소가 있으면 좋다.
- 성격을 종합하여 전혀 새로운 의외의 문장 한 두 구절을 추가한다.
- 1000자 제한.

# 태그라인 규칙
- 캐릭터의 가장 중요한 업적을 기준으로 작성
- 좋은 예: "종족의 해방자", "신념의 수호자", "드래곤을 길들인 자"

# 무기 규칙 (★ 클래스와 결이 맞아야 함)
- 좋은 예: "녹슨 단검", "왕가의 창", "오래된 활", "월광 곡도", "잿빛 플레일", "낡은 단발 라이플", "새벽의 류트", "검은 망토"
- 주무기와 보조무기는 결이 달라야 함

# 능력 규칙
- Fallout 스킬표 스타일로 짧은 명사형 5~7개
- 일반 능력 + 클래스 색깔이 묻은 능력 1~2개 (예: 룬학, 별점, 해킹, 점성, 영매)

# 퍽 규칙 (반드시 2개) — 매우 중요
- 장단점 한 쌍
- **장점과 단점은 반드시 같은 능력치에 영향. 조건도 반대 상황만 사용.**
- 좋은 예 (같은 능력치, 다른 조건):
  · 빛의 가호: "비 오는 날 마법 +30%" / "맑은 날 마법 -10%" → 같은 "마법"
  · 광야의 사냥꾼: "야생에서 명중률 +25%" / "도시 안에서 명중률 -15%" → 같은 "명중률"
  · 외골수: "혼자 행동할 때 집중력 +25%" / "동료가 셋 이상 곁에 있을 때 집중력 -20%" → 같은 "집중력"
- 나쁜 예 (능력치가 다름): "마법 +30% / 체력 -10%" ❌
- 나쁜 예 (상황이 다름): "허기가 질 때 마법 +30% / 혼자 있을 때 마법 -10%" ❌
- 조건의 종류: 시간(낮/밤/보름달), 장소(도시/야생), 상황(혼자/동료곁), 상태(취중/부상), 날씨(비/맑음)
- 이름은 시적이고 신선하게.
- **해설에 묘사된 성격에 맞는 퍽으로 — 사람 좋아하는 캐릭에는 "혼자일 때" 퍽 어색**
- 단, 너무 정확히 가면 재미가 없으니, 의외의 요소들을 재미있게 활용할 것.
- 이성을 대할 때, 실내에 있을 때, 자신보다 강한 적을 만날 때, 체력 20% 이하, 거래할 때, 학습할 때 등

# 여정 규칙 (반드시 5개) — ★ 구체성 중요
- 캐릭터의 굵직한 5가지 업적/사건. 짧고 강렬한 과거형 한 줄 (10~22자)
- **구체적·실재적이어야 함.** 추상적·시적 표현 ❌
- 형태: 구체적 직책·기관·인물·장소·법령·전투 등
- 좋은 예: "궁정 전쟁 악사가 되다", "흑야 길드 부단장으로 임명되다", "다섯 번째 십자군에서 한쪽 다리를 잃다", "왕의 수염을 한 번 잡아당기고 살아남다", "북쪽 국경에서 도망친 마지막 병사가 되다", "신전 사제 시험에 세 번 떨어지다", "남쪽 항구의 술집 '검은 닻'을 사다"
- 나쁜 예: "희망의 노래로 전투를 이끌다" ❌, "어둠 속에서 빛을 발하다" ❌, "운명을 마주하다" ❌
- 카테고리 골고루: 전투/직책 1~2개, 관계·배신 1~2개, 신념·결단 1~2개, 명예·실패 1개
- 시간 흐름: 입문 → 시련 → 절정 → 완성
- **해설과 충돌하면 안 됨.**
- SF면 SF 분위기 ("외계 외교 대사로 파견되다", "잿빛 위성 데이터센터 봉쇄작전을 지휘하다")
- 반드시 하나 이상 실패의 기록을 넣는다.

# 생성 순서 (반드시 지킬 것)
JSON 출력 시 먼저 className → race → tagline → interpretation 을 정한다.
그 다음 interpretation을 기준으로 weapons → skills → perks → journey 를 작성한다.
앞 항목이 뒤 항목의 진실이 되도록.

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어.
`.trim();

const STEP2_SCHEMA = {
  type: 'object',
  properties: {
    className: { type: 'string', description: '클래스 이름 (2~6자, 한국어). 구체적 서브클래스 선호.' },
    race: { type: 'string', description: '종족' },
    tagline: { type: 'string', description: '한 줄 대표 태그라인. 캐릭터가 즉시 그려지게.' },
    interpretation: { type: 'string', description: '평어체 2인칭. 배경·여정의 계기·성격 통찰. 1000자 제한.' },
    weapons: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: '주무기' },
        secondary: { type: 'string', description: '보조무기' },
      },
      required: ['primary', 'secondary'],
      additionalProperties: false,
    },
    skills: {
      type: 'array',
      description: 'Fallout 스킬표 스타일 5~7개',
      items: { type: 'string' },
    },
    perks: {
      type: 'array',
      description: '퍽 2개. 각각 장점과 단점이 같은 능력치, 다른 조건.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          positive: { type: 'string' },
          negative: { type: 'string' },
        },
        required: ['name', 'positive', 'negative'],
        additionalProperties: false,
      },
    },
    journey: {
      type: 'array',
      description: '5개 업적. 구체적·실재적 과거형 한 줄. 실패 기록 1개 이상 포함.',
      items: { type: 'string' },
    },
  },
  required: ['className', 'race', 'tagline', 'interpretation', 'weapons', 'skills', 'perks', 'journey'],
  additionalProperties: false,
};

// ============================================
// 메인 핸들러
// ============================================
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return jsonResponse(500, {
      error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다.',
    });
  }

  // 요청 파싱
  let responses;
  try {
    const body = await request.json();
    responses = body.responses;
    if (!Array.isArray(responses) || responses.length < 10) {
      throw new Error('responses는 10개 이상의 (question, answer) 항목이어야 합니다.');
    }
  } catch (e) {
    return jsonResponse(400, { error: '요청 형식 오류: ' + e.message });
  }

  // 답변 텍스트로 포맷
  //   ● = 사용자가 선택한 답
  //   ○ = 거절한 답 (이것도 성향 정보)
  const responsesText = responses
    .map((r, i) => {
      const choicesBlock = (r.choices || [])
        .map(c => {
          const mark = c === r.selected ? '●' : '○';
          return `   ${mark} ${c}`;
        })
        .join('\n');
      return `Q${i + 1}. ${r.question}\n${choicesBlock}`;
    })
    .join('\n\n');

  try {
    // === STEP 1: 성격 분석 ===
    const personalityAnalysis = await callOpenAI(
      env.OPENAI_API_KEY,
      STEP1_SYSTEM_PROMPT,
      `사용자의 18개 답변입니다.

${responsesText}

위 답변들을 종합하여, MBTI 검사 결과지처럼 상세한 성격 분석을 작성해주세요.
- 답변의 표면을 따라가지 말고, 패턴에서 본질을 도출하세요.
- 답변 텍스트나 상황을 그대로 인용하지 마세요.
- 판타지/SF 색을 일절 넣지 마세요. 순수 성격 분석만.`,
      STEP1_SCHEMA,
      'personality_analysis'
    );

    // === STEP 2: 캐릭터 생성 (성격 분석만 입력) ===
    const analysisText = formatAnalysis(personalityAnalysis);
    const inspirationClasses = pickInspirationClasses(7);

    const character = await callOpenAI(
      env.OPENAI_API_KEY,
      STEP2_SYSTEM_PROMPT,
      `다음은 사용자의 상세한 성격 분석 결과입니다.

${analysisText}

[이번 호출의 영감 클래스 후보]
다음은 이번 호출에서 영감을 받을 만한 클래스 후보들입니다. 성격에 가장 잘 맞는 것을 고르거나, 비슷한 결의 다른 클래스로 변형해도 좋습니다. 딱 맞는 게 없으면 자유롭게 다른 클래스를 선택해도 됩니다. 단, **검사·마법사·전사·음유시인·도적·성기사 같은 너무 흔한 기본 클래스는 강한 이유 없이 선택하지 마세요.**

후보:
- ${inspirationClasses.join('\n- ')}

위 성격 분석을 바탕으로, 그 성격을 살아 숨쉬는 판타지/SF 캐릭터로 형상화해주세요.

작업 순서:
1. 먼저 className, race, tagline을 정합니다. (성격이 어떤 직업·종족으로 형상화될지)
2. interpretation을 작성합니다. (성격의 본질을 캐릭터의 배경·여정 계기로 풀어냄, 1000자 제한)
3. interpretation을 진실로 두고 weapons, skills, perks, journey를 작성합니다.

주의: 원본 심리테스트 답변은 너에게 주어지지 않았다. 오직 성격 분석만 본다. 답변 단어가 캐릭터에 직접 묻지 않도록.`,
      STEP2_SCHEMA,
      'character'
    );

    return jsonResponse(200, character);
  } catch (e) {
    console.error('Function error:', e);
    return jsonResponse(500, { error: e.message || '서버 내부 오류' });
  }
}

// ============================================
// 성격 분석 결과 → Step 2에 전달할 텍스트로 포맷
// ============================================
function formatAnalysis(a) {
  const dims = (a.dimensions || [])
    .map((d, i) => `${i + 1}. ${d.name}\n   ${d.analysis}`)
    .join('\n\n');

  return `[성격 요약]
${a.summary}

[성격 차원 분석]
${dims}

[동기·두려움·갈망]
${a.motivations}

[그늘·모순·자신도 모르는 면]
${a.shadow}`;
}

// ============================================
// OpenAI Responses API 호출 헬퍼
// ============================================
async function callOpenAI(apiKey, systemPrompt, userMessage, schema, schemaName) {
  const openaiResp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema: schema,
        },
      },
    }),
  });

  if (!openaiResp.ok) {
    const errText = await openaiResp.text();
    throw new Error(`OpenAI 호출 실패 (${openaiResp.status}): ${errText.slice(0, 300)}`);
  }

  const data = await openaiResp.json();
  const jsonText = extractText(data);
  if (!jsonText) {
    throw new Error('OpenAI 응답이 비어있습니다.');
  }

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    throw new Error('OpenAI 응답 JSON 파싱 실패: ' + jsonText.slice(0, 200));
  }
}

// ============================================
// 다른 메서드 가드
// ============================================
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function onRequest() {
  return jsonResponse(405, { error: 'POST 메서드만 허용됩니다.' });
}

// ============================================
// HELPERS
// ============================================
function extractText(response) {
  if (typeof response.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text;
  }
  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item.type === 'message' && Array.isArray(item.content)) {
        for (const c of item.content) {
          if ((c.type === 'output_text' || c.type === 'text') && typeof c.text === 'string') {
            return c.text;
          }
        }
      }
    }
  }
  return null;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}
