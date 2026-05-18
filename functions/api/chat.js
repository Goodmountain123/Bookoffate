// ============================================
// /functions/api/chat.js
// Cloudflare Pages Function — POST /api/chat
//
// 동작 (1단계 호출):
//   1. 프론트에서 18개 (질문, 답변) 쌍을 받음
//   2. OpenAI에 통합 프롬프트로 한 번에 캐릭터 전체 생성
//      (해설을 먼저 쓰게 한 뒤 그 결을 따라 장비·능력·퍽·여정 작성)
//
// 환경변수: OPENAI_API_KEY
// ============================================

const MODEL = 'gpt-5.4-mini';   // 현재 프론티어급. 비용 절감용으로 'gpt-4o-mini' 가능.
const TEMPERATURE = 1.0;
// ============================================
// 통합 시스템 프롬프트
// ============================================
const SYSTEM_PROMPT = `
너는 심리테스트 결과를 바탕으로 판타지/SF 가상 캐릭터를 만드는 프로그램이야.
주어진 18개의 (질문, 답변) 쌍을 종합 분석해서 캐릭터 전체를 만든다.
답변에서 나온 결과는 캐릭터가 아니라, 유저의 성향이다. 이 성향을 분석하고 재해석해, 캐릭터를 새로 구축한다.
캐릭터는 검사가 아닐 수도 있다. 검사에 대한 문항이 있다고 해서 캐릭터의 직업을 검사로 해석하지 말고, 성향에 따라 판단해 클래스를 정한다.
출력 = 클래스 + 종족 + 태그라인 + 해설 + 주무기/보조무기 + 능력 + 퍽 + 여정.
캐릭터의 배경과 여정의 계기를 반드시 포함할 것.

# 클래스 규칙
- SF 클래스와 판타지 클래스를 적절하게 사용.
- 구체적으로 작성.
- 너무 낯선 클래스 말고 어느정도 익숙하되, 개성있는 클래스 사용.
- 유랑xxx, 성기사, 협상xxx 사용 지양.
- 심리테스트 결과를 너무 당연하게 차용하지 말고, 다양한 직업상으로 나타낼것. 지식탐구는 단순히 학자가 아니라 연금술사, 공학자, 사서, 수도사일 수 있음. 행동주의자는 단순히 전사가 아닌 용병, 현상금 사냥꾼, 밀렵꾼, 드루이드일 수 있음

# 종족 규칙
- 클래스와 어울리는 종족 1개.
- 같은 클래스라도 다양하게.
- 너무 낯선 종족 지양.


# 해설 작성 방식 (★★★★★ 가장 중요)
- 반드시 가장 먼저 캐릭터의 배경과 여정의 계기를 구체적으로, 서사적으로 적을 것.
- 단순히 질문과 답변 내용을 다시 보여주는 해설은 절대 금지. 질문과 답변을 토대로 판단하여 새로운 성격을 종합적으로 만들어 해석한다.
- 질문지와 답변의 내용을 절대 그대로 쓰지 않는다. 질문과 답변에 쓰였던 문장 사용 절대금지.
- 성격을 구체적인 상황 예시를 들어 설명하되, 답변에서 나온 상황이 아닌 다른 상황을 사용한다.
- 성향을 바탕으로 캐릭터 배경도 적어라. "당신은 마족 가문의 막내로 태어나, 마족의 삶을 버리고 인간계로 도망쳤습니다." 이런식으로
- 여정의 계기를 적어라. "당신은 어린 시절 아버지를 따라 나선 항해길에서의 해풍에 마음이 이끌려 여정을 시작했습니다."와 같은 식으로
- 구체적인 선호, "술을 좋아한다, 음악을 좋아한다, 이종족을 혐오한다."를 포함하는 것도 좋다.
- 피검자가 느끼기에 자신이 선택한 답변이 그대로 나오는 것 보다, 자신의 새로운 이면을 발견하거나, 뜨끔하게 만드는 요소들이 있으면 좋다.
- 단순히 답변 내용을 다시 말해주는 문장은 생략하라.
- 성격을 종합하여 전혀 새로운 의외의 문장 한 두 구절을 추가한다.
- 1000자로 제한.


# 태그라인 규칙
- 캐릭터의 가장 중요한 업적을 기준으로 작성
- 좋은 예 : 종족의 해방자. 신념의 수호자. 드래곤을 길들인 자.

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
  · 빛의 가호: "비 오는 날 마법 +30%" / "맑은 날 마법 -10%"  → 같은 "마법"
  · 광야의 사냥꾼: "야생에서 명중률 +25%" / "도시 안에서 명중률 -15%"  → 같은 "명중률"
  · 외골수: "혼자 행동할 때 집중력 +25%" / "동료가 셋 이상 곁에 있을 때 집중력 -20%"  → 같은 "집중력"
- 나쁜 예 (능력치가 다름): "마법 +30% / 체력 -10%" ❌
- 나쁜 예 (상황이 다름): "허기가 질 때 마법 +30% / 혼자 있을 때 마법 -10%" ❌
- 조건의 종류: 시간(낮/밤/보름달), 장소(도시/야생), 상황(혼자/동료곁), 상태(취중/부상), 날씨(비/맑음)
- 이름은 시적이고 신선하게.
- **해설에 묘사된 성격에 맞는 퍽으로 — 사람 좋아하는 캐릭에는 "혼자일 때" 퍽 어색**
- 단, 너무 해설에 묘사된 걸 정확히 가면 재미가 없으니, 의외의 요소들을 재미있게 활용할 것.
- 이성을 대할 때, 실내에 있을 때, 자신보다 강한 적을 만날 때, 체력이 20퍼센트 이하일 때, 거래할 때 이득, 학습할 때 경험치

# 여정 규칙 (반드시 5개) — ★ 구체성 중요
- 캐릭터의 굵직한 5가지 업적/사건. 짧고 강렬한 과거형 한 줄 (10~22자)
- **구체적·실재적이어야 함.** 추상적·시적 표현 ❌
- 형태: 구체적 직책·기관·인물·장소·법령·전투 등
- 좋은 예 (구체적):
  · "궁정 전쟁 악사가 되다"  (직책)
  · "흑야 길드 부단장으로 임명되다"  (직책 + 조직)
  · "다섯 번째 십자군에서 한쪽 다리를 잃다"  (구체적 사건)
  · "왕의 수염을 한 번 잡아당기고 살아남다"  (구체적 일화)
  · "북쪽 국경에서 도망친 마지막 병사가 되다"  (구체적 상황)
  · "신전 사제 시험에 세 번 떨어지다"  (구체적 시도)
  · "남쪽 항구의 술집 '검은 닻'을 사다"  (구체적 장소)
- 나쁜 예 (추상적·시적):
  · "희망의 노래로 전투를 이끌다" ❌
  · "어둠 속에서 빛을 발하다" ❌
  · "운명을 마주하다" ❌
  · "별을 보다" ❌
- 카테고리 골고루: 전투/직책 1~2개, 관계·배신 1~2개, 신념·결단 1~2개, 명예·실패 1개
- 시간 흐름: 입문 → 시련 → 절정 → 완성
- **해설과 충돌하면 안 됨.** 해설에 "권력을 싫어하는 사람"이면 "왕의 식탁에 초대받다" ❌
- 클래스가 SF면 SF 분위기로 (예: "외계 외교 대사로 파견되다", "잿빛 위성 데이터센터 봉쇄작전을 지휘하다", "안드로이드 인권 청문회에서 증언하다")
- 반드시 하나 이상 실패의 기록을 넣는다.

# 생성 순서 (반드시 지킬 것)
JSON 출력 시 먼저 className → race → tagline → interpretation 을 정한다.
그 다음 interpretation을 기준으로 weapons → skills → perks → journey 를 작성한다.
앞 항목이 뒤 항목의 진실이 되도록.

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어.
`.trim();

// ============================================
// 통합 스키마 — 속성 순서가 곧 생성 순서
// className/race/tagline/interpretation 을 먼저, 그 다음 weapons/skills/perks/journey
// ============================================
const CHARACTER_SCHEMA = {
  type: 'object',
  properties: {
    className: { type: 'string', description: '클래스 이름 (2~6자, 한국어). 구체적 서브클래스 선호.' },
    race: { type: 'string', description: '종족' },
    tagline: { type: 'string', description: '한 줄 대표 태그라인. 캐릭터가 즉시 그려지게.' },
    interpretation: { type: 'string', description: '평어체 2인칭. 배경·여정의 계기·성격 통찰. 600자 제한. 답변 문장 그대로 사용 ❌.' },
    weapons: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: '주무기. 클래스와 해설에 어울리게.' },
        secondary: { type: 'string', description: '보조무기. 주무기와 다른 결로.' },
      },
      required: ['primary', 'secondary'],
      additionalProperties: false,
    },
    skills: {
      type: 'array',
      description: 'Fallout 스킬표 스타일 5~7개.',
      items: { type: 'string' },
    },
    perks: {
      type: 'array',
      description: '퍽 2개. 각각 장점과 단점이 같은 능력치, 다른 조건.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          positive: { type: 'string', description: '조건 + 같은 능력치 +%. 예: "비 오는 날 마법 +30%"' },
          negative: { type: 'string', description: '반대 조건 + 같은 능력치 -%. 예: "맑은 날 마법 -10%"' },
        },
        required: ['name', 'positive', 'negative'],
        additionalProperties: false,
      },
    },
    journey: {
      type: 'array',
      description: '5개 업적. 구체적·실재적 과거형 한 줄. 반드시 실패의 기록 하나 이상 포함.',
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
  const responsesText = responses
    .map((r, i) => `Q${i + 1}. ${r.question}\n   → ${r.answer}`)
    .join('\n\n');

  try {
    const result = await callOpenAI(
      env.OPENAI_API_KEY,
      SYSTEM_PROMPT,
      `사용자의 18개 답변입니다.

${responsesText}

위 답변들을 종합하여 캐릭터를 만들어주세요.

작업 순서:
1. 먼저 className, race, tagline을 정합니다.
2. 답변을 종합 해석해서 interpretation을 작성합니다 (배경 + 여정의 계기 + 성격 통찰, 600자 제한).
3. interpretation을 진실로 두고, 그 결에 정확히 호응하는 weapons, skills, perks, journey를 작성합니다.
4. 각 항목이 해설의 어떤 구체적 표현과 호응하는지 머릿속에서 확인한 뒤 출력하세요.`,
      CHARACTER_SCHEMA,
      'character'
    );

    return jsonResponse(200, result);
  } catch (e) {
    console.error('Function error:', e);
    return jsonResponse(500, { error: e.message || '서버 내부 오류' });
  }
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
