// ============================================
// /functions/api/chat.js
// Cloudflare Pages Function — POST /api/chat
//
// 동작 (2단계 호출):
//   1. 프론트에서 18개 (질문, 답변) 쌍을 받음
//   2. [Step 1] 답변을 종합 → 캐릭터 본질 (className, race, tagline, interpretation)
//   3. [Step 2] 본질을 입력으로 → 장비·능력·여정 (weapons, skills, perks, journey)
//   4. 두 결과를 합쳐서 반환
//
// 환경변수: OPENAI_API_KEY
// ============================================

const MODEL = 'gpt-5.4-mini';   // 현재 프론티어급. 비용 절감용으로 'gpt-4o-mini' 가능.
const TEMPERATURE = 0.9;

// ============================================
// STEP 1 — 캐릭터 본질
// ============================================
const STEP1_SYSTEM_PROMPT = `
너는 심리테스트 결과를 바탕으로 판타지/SF 가상 캐릭터를 만드는 프로그램의 1단계야.
주어진 18개의 (질문, 답변) 쌍을 종합 분석해서 캐릭터의 본질을 만든다.
본질 = 클래스 + 종족 + 태그라인 + 해설.

# 분석 방식 (★ 중요)
- 단순히 답변들을 나열하지 말고, 답변들의 성향을 종합해서 새로운 결론을 도출하라.
- 구체적인 선호, "술을 좋아한다, 음악을 좋아한다, 이종족을 혐오한다."를 포함하는 것도 좋다.
- 피검자가 느끼기에 너무 자신이 선택한 답변이 그대로 나오는 것 보다, 자신의 새로운 이면을 발견하거나, 뜨끔하게 만드는 요소들이 있으면 좋다.
- 단순히 답변을 다시 말해주는 해설은 생략하라.
- 성향을 바탕으로 캐릭터 배경도 적어라. "당신은 마족 가문의 막내로 태어나, 마족의 삶을 버리고 인간계로 도망쳤습니다." 이런식으로

# 클래스 다양성 (★ 매우 중요)
- 답변 패턴에 따라 다음 결을 적극 활용하라:
  · 자주+자유+감각 → 도적·암살자·해적·총잡이·닌자
  · 헌신+이상+추상 → 마법사·드루이드·소환사·점성술사·바드
  · 자주+추상+규범 → 비전마법사·룬 학자·연금술사
  · 사회+직관+감각 → 무도가·검사·사무라이·용기사
  · 헌신+미래+추상 → 네크로맨서·사이오닉·시간 여행자
  · 사회+자유+현재 → 음유시인·바드·해적
  · 추상+계산+미래 → SF 분위기 (사이오닉, 해커, 침투요원 등)
- 같은 클래스라도 변형: "추방된 성기사", "회개한 도적", "잠적한 마법사", "은퇴한 검사"

[참고용 클래스]
판타지: 음유시인, 드루이드, 네크로맨서, 소환사, 무도가, 마검사, 점성술사, 비전마법사, 도적, 암살자, 해적, 사무라이, 닌자, 용기사, 레인저, 마법사, 검사, 전사, 총잡이, 성기사, 현상금사냥꾼
SF: 사이오닉, 해커, 침투요원, 시간 여행자, 사이보그, 안드로이드, 우주 탐사자, 초능력자, 메카 파일럿, 우주 해적, 바운티 헌터

# 종족 규칙
- 클래스와 어울리는 종족 1개.
- 판타지: 인간, 엘프, 하프엘프, 다크엘프, 하이엘프, 드워프, 노움, 하플링, 티플링, 드래곤본, 오크, 하프오크, 늑대인간, 정령, 천계인, 마족
- SF: 인간, 변종, 안드로이드, 사이보그, 외계인, 휴머노이드
- 같은 클래스라도 다양하게.

# 태그라인 규칙
- 캐릭터의 가장 대표적 특성을 한 줄로 압축. **듣자마자 "아, 이런 사람이구나" 그림이 그려져야 함.**
- 너무 추상적이지 않게, 행동·태도가 보이는 결로
- 좋은 예: "바람을 등지고 잔을 든 자", "사람을 사랑하면서도 누구의 손도 잡지 않는 자", "표적이 정해지면 잠들지 않는 자", "별의 흐름을 등에 짊어진 자"

# 해설 규칙 (★ 가장 중요)
- "당신은 ~합니다." 식의 평어체 2인칭. **7~9문장.**
- 본질은 심리테스트 결과지. 사용자의 성격을 따뜻하게 짚어주는 게 핵심.

## 종합 해석 — 답변을 그대로 옮기지 마라 (★★★)
- 각 답변을 한 문장씩 받아쓰지 마라. **18개 답변을 통째로 흡수해서 새로운 결론을 도출하라.**
- 답변에 명시되지 않은, 그러나 답변 패턴에서 유추되는 통찰을 적어라.
- 예시:
  · 답변에 "오늘은 오늘, 내일은 내일이다"가 있다고 해서
    "당신은 순간의 즐거움을 소중히 여깁니다" 같은 직역 ❌
  · 대신 종합해서 → "당신에게 가장 중요한 것은 살아 숨쉬는 지금입니다." 또는
    "당신의 시계는 늘 지금 이 순간에 멈춰 있습니다." 같은 결로 ✓

## 약간 시적 톤 — 직역체 → 운율있는 결론
- "당신은 X합니다" 식의 평이한 진술과
- "당신에게 X은 Y입니다", "당신의 Y는 X입니다" 식의 약간 비유적 결론을 섞어라.
- 좋은 변환 예:
  · "당신은 혼자 있는 걸 좋아합니다" ❌ →
    "당신의 발걸음은 누구의 지도에도 그려져 있지 않습니다" ✓
  · "당신은 책임감이 강합니다" ❌ →
    "당신의 어깨 위에는 늘 자기 자신과 한 약속이 얹혀 있습니다" ✓
  · "당신은 새로운 걸 좋아합니다" ❌ →
    "당신은 어제와 같은 길을 두 번 걷지 않습니다" ✓
- **너무 추상적으로 가지는 마라.** 사용자가 무슨 뜻인지 즉시 이해돼야 함.
- 절반은 평이한 진술, 절반은 시적 결론 — 그 사이에서 균형 잡아라.

## 깊이
- 평소 어떤 식으로 행동하는지
- 어떤 사람들과 잘 지내고 어떤 사람과 부딪히는지
- 무엇을 깊이 두려워하고 무엇을 갈망하는지
- 자기 자신에 대해 잘 안 보이는 모순이나 그늘
- "당신은 X합니다. 그것은 Y 때문입니다." 인과 문장 1~2번
- **마지막 1~2문장에만 이세계 가미.** 클래스·종족과 자연스럽게 연결.

# 엣지 케이스
- 답변이 일관되지 않으면 그 모순 자체가 매력. "낮에는 사람을 좋아하고 밤에는 혼자가 그리운 사람" 같은 결로.

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어.
`.trim();

const STEP1_SCHEMA = {
  type: 'object',
  properties: {
    className: { type: 'string', description: '클래스 이름 (2~6자, 한국어)' },
    race: { type: 'string', description: '종족' },
    tagline: { type: 'string', description: '한 줄 대표 태그라인. 캐릭터가 즉시 그려지게.' },
    interpretation: { type: 'string', description: '평어체 2인칭 7~9문장. 본질은 심리테스트, 마지막 1~2문장만 이세계 가미.' },
  },
  required: ['className', 'race', 'tagline', 'interpretation'],
  additionalProperties: false,
};

// ============================================
// STEP 2 — 장비·능력·여정
// ============================================
const STEP2_SYSTEM_PROMPT = `
너는 캐릭터 본질을 받아 장비·능력·여정을 만드는 프로그램의 2단계야.
1단계에서 만들어진 캐릭터의 클래스·종족·태그라인·해설을 받아, 그 결에 정확히 맞는 장비·능력·퍽·여정을 만든다.

# 작업 방식 (★★★ 매우 중요)
- 해설을 자세히 읽어라. **출력할 모든 항목은 해설의 어떤 구체적 표현에 반드시 호응해야 함.**
- 출력 전 머릿속에서 mental link를 잡아라:
  · 이 무기는 해설의 "[구절]"에 호응한다
  · 이 능력은 해설의 "[구절]"에 호응한다
  · 이 퍽은 해설의 "[구절]"에 호응한다
  · 이 여정 사건은 해설의 "[구절]"에서 자연스럽게 따라온다
- 본질과 어긋나면 절대 안 됨.
- 예: 해설에 "혼자가 편한 사람"이면 무기에 "동료들의 환호" ❌, 여정에 "갱단의 리더가 되다" ❌
- 예: 해설에 "사람들 곁이 자기 자리"라면 능력에 "잠적" ❌

# 무기 규칙 (★ 클래스와 결이 맞아야 함)
- 추상적 수식어든 구체적 표현이든 **결만 맞으면 OK**. 너무 시적일 필요 없다.
- 좋은 예: "녹슨 단검", "왕가의 창", "오래된 활", "월광 곡도", "잿빛 플레일", "낡은 단발 라이플", "새벽의 류트", "검은 망토"
- 클래스별 무기군:
  · 음유시인·바드 → **악기** (류트, 리라, 하프, 작은 북) + 단검 / 화살. 검·지팡이 ❌
  · 마법사·비전마법사·점성술사 → 지팡이·룬봉·천문도 + 단검·룬 카드
  · 검사·사무라이·마검사 → 검·곡도·쌍검 + 단도
  · 도적 → 단검·접이식 칼 + 표창·올가미
  · 암살자 → 독침·소음 단검 + 와이어
  · 해적 → 커틀러스·도끼·단발총
  · 레인저·사냥꾼 → 활·석궁 + 단검·올가미
  · 무도가 → 맨손·곤·쌍절곤 + 표창
  · 닌자 → 닌자도·쿠나이 + 표창·연막
  · 성기사 → 양손검·메이스 + 방패
  · 드루이드 → 룬봉·돌도끼·낫 + 약초낭
  · 네크로맨서·소환사 → 해골 지팡이·낫 + 소환서
  · 총잡이 → 권총·라이플 + 단검
  · 현상금사냥꾼 → 라이플·석궁 + 단검
  · 용기사 → 창·할버드 + 단도
  · 사이오닉 → 정신력 자체·룬 카드 + 약물
  · 해커 → 휴대 단말기·EMP + 접이식 칼
  · 침투요원 → 소음권총·전자 후크 + 위장복
  · 안드로이드 → 내장 빔·진동검 + 정찰 드론
- 주무기와 보조무기는 결이 달라야 함

# 능력 규칙
- Fallout 스킬표 스타일로 짧은 명사형 5~7개
- 일반 능력 + 클래스 색깔이 묻은 능력 1~2개 (예: 룬학, 별점, 해킹, 무영보, 점성, 영매)

# 퍽 규칙 (반드시 2개) — 매우 중요
- 장단점 한 쌍
- **장점과 단점은 반드시 같은 능력치에 영향. 조건만 다름.**
- 좋은 예 (같은 능력치, 다른 조건):
  · 빛의 가호: "비 오는 날 마법 +30%" / "맑은 날 마법 -10%"  → 같은 "마법"
  · 광야의 사냥꾼: "야생에서 명중률 +25%" / "도시 안에서 명중률 -15%"  → 같은 "명중률"
  · 외골수: "혼자 행동할 때 집중력 +25%" / "동료가 셋 이상 곁에 있을 때 집중력 -20%"  → 같은 "집중력"
- 나쁜 예 (능력치가 다름): "마법 +30% / 체력 -10%" ❌
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

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어.
`.trim();

const STEP2_SCHEMA = {
  type: 'object',
  properties: {
    weapons: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: '주무기. 클래스에 어울리는 무기 유형. 구체적이든 시적이든 OK.' },
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
          negative: { type: 'string', description: '다른 조건 + 같은 능력치 -%. 예: "맑은 날 마법 -10%"' },
        },
        required: ['name', 'positive', 'negative'],
        additionalProperties: false,
      },
    },
    journey: {
      type: 'array',
      description: '5개 업적. 짧고 강렬한 과거형 한 줄.',
      items: { type: 'string' },
    },
  },
  required: ['weapons', 'skills', 'perks', 'journey'],
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
    // === STEP 1: 캐릭터 본질 ===
    const step1Result = await callOpenAI(
      env.OPENAI_API_KEY,
      STEP1_SYSTEM_PROMPT,
      `사용자의 18개 답변입니다.\n\n${responsesText}\n\n위 답변들을 종합하여 캐릭터의 본질(클래스, 종족, 태그라인, 해설)을 만들어주세요.`,
      STEP1_SCHEMA,
      'character_essence'
    );

    // === STEP 2: 장비·능력·여정 ===
    const essenceText = `클래스: ${step1Result.className}
종족: ${step1Result.race}
태그라인: ${step1Result.tagline}

해설:
${step1Result.interpretation}`;

    const step2Result = await callOpenAI(
      env.OPENAI_API_KEY,
      STEP2_SYSTEM_PROMPT,
      `다음은 1단계에서 만들어진 캐릭터의 본질입니다.

${essenceText}

이 캐릭터에게 어울리는 장비·능력·퍽·여정을 만들어주세요.

작업 전 머릿속에서 다음을 확인하세요:
1. 각 출력 항목이 해설의 어떤 구체적 표현과 호응하는지 (mental link)
2. 해설과 어긋나는 항목은 절대 만들지 않기
3. 여정은 추상적·시적이지 말고 실재적·구체적인 사건·직책·기관·장소로
4. 무기는 클래스 유형과 정확히 맞춰서 (음유시인은 악기·단검 등)`,
      STEP2_SCHEMA,
      'character_equipment'
    );

    // 합쳐서 반환
    return jsonResponse(200, { ...step1Result, ...step2Result });
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
