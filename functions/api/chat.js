// ============================================
// /functions/api/chat.js
// Cloudflare Pages Function — POST /api/chat
//
// 동작 (2단계 호출):
//   1. 프론트에서 18개 (질문, 답변) 쌍을 받음
//   2. [Step 1] 답변 → 성격 키워드 요약
//   3. [Step 2] 성격 분석만 → 판타지 캐릭터 (원본 답변은 차단)
//   4. Step 2 결과 + 디버그 정보 반환
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
  '북방 전사', '마검사', '흑기사', '용기사', '용 사냥꾼', '격투가', '검투사', '야만인',
  // 판타지 마법
  '연금술사', '강령술사', '주술사', '비전 마법사',
  '원소술사', '룬 새김장', '마법공학자',
  // 판타지 자연
  '드루이드', '정령술사', '사냥꾼', '약초사',
  // 판타지 어둠
  '악마 사냥꾼', '뱀파이어 사냥꾼', '마녀',
  // 판타지 잠입
  '그림자 도적', '닌자', '거리의 사기꾼', '암살자', '함정 해제자', '사무라이', '역병의사', '음유시인', '조련술사', '소환술사', '해적 선장', '보물 수색자',
  // 판타지 직업
  '길드 용병', '현상금 사냥꾼', '항해사', '포션 제조자',
  // 판타지 신성
  '전투사제', '수도사', '광신자', '주교', '치유사', '퇴마술사', '성기사',
  // SF 전투
  '메카 조종사', '저격수', '우주 용병', '우주 해적', '우주함대 제독',
  // SF 기술
  '해커', '사이오닉', '안드로이드 정비공',
  // SF 사회·정보
  '외계 종족학자', '성간항법사',
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
// 종족 풀 — 인간·하프엘프 디폴트 수렴 우회
// ============================================
const RACE_POOL = [
  // 엘프 계열
  '다크엘프', '하이엘프', '우드엘프',
  // 드워프 계열
  '드워프', '산악 드워프',
  // 소형 종족
  '하플링', '노움',
  // 오크 계열
  '오크', '하프오크', '고블린',
  // 야수 인간형
  '수인',
  // 신성·이종 혈통
  '드래곤본', '티플링', '마족',
  // 인간
  '인간',
  // 수중
  '인어',
  // 변형·언데드
  '뱀파이어', '언데드',
  // 인공·SF
  '안드로이드', '복제인간', '합성생명체',
  // 외계
  '외계인',
];

function pickInspirationRaces(n = 5) {
  const pool = [...RACE_POOL];
  const picked = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

// ============================================
// STEP 1 — 성격 키워드 분석 (간단명료)
// ============================================
const STEP1_SYSTEM_PROMPT = `
너는 심리테스트 결과를 바탕으로 사용자의 성격을 분석하는 전문가야.
주어진 18개의 문항을 종합하여, 이 사람의 본질을 드러내는 키워드들을 도출한다.

# 입력 형식
- 각 문항마다 4개의 선택지가 모두 제시된다.
- ● 표시: 사용자가 **선택한** 답
- ○ 표시: 사용자가 **선택하지 않은** 답


# 분석 방식 (★★★★★ 가장 중요)
- 각 문항의 표면적 답변에 매이지 마라. 18개 답변 전체의 **패턴**을 종합해 본질을 도출하라.
- **판타지/SF 색을 일절 넣지 마라.** 순수 일반 성격 키워드.

# 출력
- summary: 이 사람의 가장 본질적인 특성을 키워드식으로 간단명료하게 나열.
  · 형식: 쉼표로 구분된 형용사·명사 (예: "진보주의자, 창의적, 개인주의적, 이타적, 신중함, 약간의 우울")
  · 8~15개 정도의 키워드. 너무 진부한 키워드(예: 똑똑함, 좋은 사람) 금지.
  · 표면 성향뿐 아니라 답변에서 드러나는 모순·그늘·갈망까지 포함.

모든 텍스트는 한국어.
`.trim();

const STEP1_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '이 사람의 본질을 드러내는 키워드들. 쉼표로 구분된 형용사·명사 나열 (예: "진보주의자, 창의적, 개인주의적, 이타적").',
    },
  },
  required: ['summary'],
  additionalProperties: false,
};

// ============================================
// STEP 2 — 판타지 캐릭터 생성 (성격 분석만 입력)
// ============================================
const STEP2_SYSTEM_PROMPT = `
너는 사용자의 성격 분석 결과를 바탕으로 그에 어울리는 판타지/SF 가상 캐릭터를 만드는 프로그램이야.

# 진부함 차단 (★★★★★)
- 두 번 같은 캐릭터를 만들면 실패다.
- 성격 키워드를 단순 대입하지 말고, 키워드 조합에서 입체적인 한 인물을 빚어내라.
- 성격 키워드를 결합해 그럴듯 한 인물 표면을 만든다.

# 출력 = 클래스 + 종족 + 태그라인 + 해설 + 주무기/보조무기 + 능력 + 퍽 + 여정

# 클래스 규칙
- **클래스는 enum 목록(=CLASS_POOL) 안에서만 선택. 그 외 절대 금지.**
- 사용자 메시지의 "영감 후보"를 우선 참고하되, 성격에 더 잘 맞는 enum 클래스가 있으면 그쪽으로.
- 같은 성격이라도 매번 다른 클래스로 형상화될 수 있어야 함.
- 표면적 매핑("지식 좋아함 → 학자류" 식)에만 의존하지 말고, 성격의 깊은 결을 보고 결정.

# 종족 규칙 (★ 다양성 매우 중요)
- 종족 1개.
- 같은 클래스라도 종족을 매번 다르게.

# 해설 작성 방식 (★★★★★ 가장 중요)
- 어조는 '당신은…' 식의 평서문 (2인칭).
- 캐릭터의 배경과 여정의 계기를 적고, 그 아래로 취향·선호·태도 등 표면적 요소를 적는다.
- 구체적이고 표면적인 선호("술을 좋아한다, 음악을 좋아한다, 이종족을 혐오한다")를 반드시 넣는다.
- 유머러스하고 장난스러운 문장을 반드시 넣는다.
- 캐릭터와 배경, 클래스를 반영한다.
- 해설이 "다른 세계의 자신"처럼 느껴지도록 성격 분석을 공감가게 반영.
- 600자 제한.

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
    className: {
      type: 'string',
      description: '클래스 이름. 반드시 enum 중 하나에서만 선택.',
      enum: CLASS_POOL,
    },
    race: {
      type: 'string',
      description: '종족. 반드시 enum 중 하나.',
      enum: [
        '다크엘프', '하이엘프', '우드엘프',
        '드워프', '산악 드워프',
        '하플링',
        '노움',
        '오크', '하프오크', '고블린',
        '수인',
        '드래곤본',
        '티플링', '마족',
        '인간',
        '인어',
        '뱀파이어', '언데드',
        '안드로이드', '복제인간', '합성생명체',
        '외계인',
      ],
    },
    tagline: { type: 'string', description: '한 줄 대표 태그라인. 캐릭터가 즉시 그려지게.' },
    interpretation: { type: 'string', description: '평서문 2인칭. 배경·여정의 계기·일상·관계·성격 통찰. 1500자 내외, 최대 3000자.' },
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
  let responses, gender;
  try {
    const body = await request.json();
    responses = body.responses;
    gender = body.gender === 'f' ? 'f' : 'm';   // 기본값 m
    if (!Array.isArray(responses) || responses.length < 10) {
      throw new Error('responses는 10개 이상의 (question, answer) 항목이어야 합니다.');
    }
  } catch (e) {
    return jsonResponse(400, { error: '요청 형식 오류: ' + e.message });
  }

  const genderLabel = gender === 'f' ? '여성' : '남성';

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
    // === STEP 1: 성격 키워드 분석 ===
    const personalityAnalysis = await callOpenAI(
      env.OPENAI_API_KEY,
      STEP1_SYSTEM_PROMPT,
      `사용자의 18개 답변입니다.

${responsesText}

위 답변들을 종합하여, 이 사람의 본질을 드러내는 키워드들을 쉼표로 구분해 나열해주세요.
- 답변의 표면을 따라가지 말고, 패턴에서 본질을 도출하세요.
- 답변 텍스트나 상황을 그대로 인용하지 마세요.
- 판타지/SF 색을 일절 넣지 마세요. 순수 성격 키워드만.
- 8~15개 정도의 다양한 형용사·명사 키워드.`,
      STEP1_SCHEMA,
      'personality_analysis'
    );

    // === STEP 2: 캐릭터 생성 (성격 분석만 입력) ===
    const analysisText = formatAnalysis(personalityAnalysis);
    const inspirationClasses = pickInspirationClasses(7);
    const inspirationRaces = pickInspirationRaces(5);

    const character = await callOpenAI(
      env.OPENAI_API_KEY,
      STEP2_SYSTEM_PROMPT,
      `다음은 사용자의 성격 분석 결과입니다.

${analysisText}

[캐릭터의 성별 — ★★★ 반드시 반영]
이 캐릭터는 **${genderLabel}**입니다. interpretation·journey·tagline 작성 시 이 성별에 자연스럽게 부합하도록 작성하세요. 성별을 명시적으로 반복할 필요는 없지만, 묘사·이름·역할·배경 모든 곳에 이 성별의 결이 자연스럽게 묻어나야 합니다.

[이번 호출의 영감 클래스 후보]
다음은 이번 호출의 클래스 영감입니다. 성격에 가장 잘 맞는 것을 우선 고려하세요. 영감 후보가 딱 맞지 않으면 전체 풀(enum)에서 다른 것을 골라도 됩니다. **반드시 풀 안에서만 선택.**

후보:
- ${inspirationClasses.join('\n- ')}

[이번 호출의 영감 종족 후보]
다음은 이번 호출의 종족 영감입니다. 클래스와 어울리는 것을 고르거나, 비슷한 결로 응용하세요. **인간은 너무 자주 나오는 디폴트이니 다른 종족이 충분히 맞으면 다른 쪽을 우선 고려하세요.**

후보:
- ${inspirationRaces.join('\n- ')}

위 성격 분석 + 성별 + 영감 후보를 바탕으로, 그 성격을 살아 숨쉬는 판타지/SF 캐릭터로 형상화해주세요.

작업 순서:
1. 먼저 className, race, tagline을 정합니다.
2. interpretation을 작성합니다. (배경 서사 → 여정의 계기 → 일상/관계/태도 묘사, ${genderLabel} 캐릭터의 결로, 1500자 내외)
3. interpretation을 진실로 두고 weapons, skills, perks, journey를 작성합니다.

주의: 원본 심리테스트 답변은 너에게 주어지지 않았다. 오직 성격 키워드만 본다.`,
      STEP2_SCHEMA,
      'character'
    );

    return jsonResponse(200, {
      ...character,
      _debug: {
        gender: genderLabel,
        personalityAnalysis,
        inspirationClasses,
        inspirationRaces,
      },
    });
  } catch (e) {
    console.error('Function error:', e);
    return jsonResponse(500, { error: e.message || '서버 내부 오류' });
  }
}

// ============================================
// 성격 분석 결과 → Step 2에 전달할 텍스트로 포맷
// ============================================
function formatAnalysis(a) {
  return `[성격 키워드]
${a.summary || '(없음)'}`;
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
