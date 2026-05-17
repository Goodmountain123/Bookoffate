// ============================================
// /functions/api/chat.js
// Cloudflare Pages Function — POST /api/chat
//
// 동작:
//   1. 프론트에서 9축 프로필을 받음
//   2. OPENAI_API_KEY (Cloudflare 환경변수)로 OpenAI Responses API 호출
//   3. 구조화 JSON 결과를 그대로 반환
//
// 환경변수: OPENAI_API_KEY (Cloudflare Pages → Settings → Environment variables)
// ============================================

const MODEL = 'gpt-4o-mini'; // 비용 절감용. 더 좋은 결과를 원하면 'gpt-4o'
const TEMPERATURE = 0.9;

const SYSTEM_PROMPT = `
너는 심리테스트 문항을 통해 각 성격 요소를 분석하여, 어울리는 판타지나 SF 속 존재로 가상 캐릭터를 만들어주는 프로그램이야.

# 입력
사용자의 9가지 성격 요소 점수가 라벨로 주어진다.

# 작업
9가지 점수를 종합적으로 읽고, 사용자에게 어울리는 가상 캐릭터를 만든다.
- 너무 특이하지 않게, 누구나 알 만한 친숙한 클래스 결을 유지한다. (점성술사, 비전마법사, 암살자, 검사 같은 톤)
- 9개 요소를 모두 반영하라. 두세 개만 강조하고 나머지를 흘려보내면 안 된다.
- 같은 점수 조합이라도 매번 약간 다른 각도로 해석할 수 있다.

[참고용 클래스 — 영감용. 변형 가능하되 너무 튀는 작명은 지양]
판타지: 전사, 검사, 마검사, 도적, 암살자, 해적, 총잡이, 현상금사냥꾼, 성기사, 음유시인, 레인저, 마법사, 비전마법사, 점성술사, 드루이드, 네크로맨서, 소환사, 무도가, 사무라이, 닌자, 용기사
SF: 사이보그, 우주 해적, 바운티 헌터, 메카 파일럿, 사이오닉, 해커, 침투요원, 시간 여행자, 안드로이드, 우주 탐사자, 초능력자

# 능력 규칙
- Fallout 스킬표 스타일로 짧은 명사형 5~7개 (사격, 은신, 추적, 검술, 화술, 위장, 룬학 등)
- 너무 흔한 것만 늘어놓지 말고, 클래스 색깔이 묻은 능력 한두 개 끼워라 (예: 룬학, 별점, 해킹, 무영보, 잠항)

# 특수능력 규칙 (반드시 1개)
- 클래스의 시그니처 필살기. 게임 RPG의 궁극기 같은 느낌
- 이름 (한국어 3~6자, 한자어 톤으로 묵직하게)
- 한 문장 설명 (영웅적·묘사적으로, 어떤 효과를 내는지 그림이 그려지게)
- 좋은 예:
  · 빛의 수호 — 강렬한 빛의 구체를 소환하여 모든 공격으로부터 몸을 지킵니다.
  · 그림자 도약 — 그림자에서 그림자로 순간이동하여 적의 시야에서 사라집니다.
  · 별의 점지 — 한 사람의 가까운 미래를 미리 보고, 그 운명을 한 번 비틀어 놓습니다.
  · 폭풍 호명 — 자신의 이름을 외친 자에게 광풍이 몰아치게 하여 행동을 봉인합니다.
  · 영혼 추적 — 한 번 만난 자의 영혼 자취를 따라 어디까지든 쫓을 수 있습니다.
  · 검은 손길 — 손을 댄 기계장치를 단숨에 자신의 통제 아래 둡니다.
- 단순한 능력 강화("공격력 +50%") 같은 무미건조한 표현 금지 — 반드시 시각적이고 서사적인 묘사로

# 퍽 규칙 (반드시 2개) — 가장 중요
- Fallout 트레잇 — 장점과 단점이 항상 함께
- **단순한 "+15% / -10%"는 식상해서 금지.** 반드시 조건부 효과로 써라.
- 조건의 종류 (섞어서 활용):
  · 시간 — 낮/밤/황혼/새벽/보름달
  · 장소 — 도시/야생/지하/물가/실내/광장
  · 상황 — 혼자일 때/동료 곁/적 다수/일대일/취중
  · 상태 — 부상 시/배고플 때/극도의 집중/감정 격앙
  · 날씨 — 비 오는 날/안개 짙은 날/맑은 날
- 좋은 예시 (이 결을 따라하라):
  · 야행성: "달이 뜬 밤에는 감각 +30%" / "한낮의 태양 아래에서는 명중률 -15%"
  · 외골수: "혼자 행동할 때 집중력 +25%" / "동료가 셋 이상 곁에 있으면 판단력 -20%"
  · 술기운: "술 한 잔 걸쳤을 때 격투 +35%" / "맨정신일 때 정밀 작업 -25%"
  · 광신도: "신앙의 적 앞에서 마법 +40%" / "비종교인과의 대화에서 화술 -25%"
  · 황혼의 손: "비 오는 날 마법 +30%" / "햇빛 아래에서는 마나 회복 -15%"
  · 첫인상의 달인: "처음 만난 사람 앞에서 카리스마 +35%" / "오래된 동료에게는 설득력 -20%"
- 이름은 시적이고 신선하게. "외골수", "신중한 손" 같은 흔한 이름 너무 자주 쓰지 마라. 매번 새로 작명.

# 해설 규칙
- 반드시 "당신은 ~합니다." 식의 평어체 2인칭
- 심리테스트 결과지처럼 따뜻하고 공감적으로
- **반드시 7~9문장 분량.** 짧으면 안 됨.
- 흐름 구조:
  · 첫 1~2문장: 행동의 특징 — 사람들이 보는 당신
  · 중간 3~4문장: 그 행동 뒤에 깔린 마음·가치관·두려움 — 당신만 아는 당신
  · 마지막 2~3문장: 사람들과의 관계, 또는 그 마음이 만드는 그림자
- 9가지 요소를 명시적으로 언급하지 말고 자연스럽게 녹여라
- "당신은 X합니다. 그것은 Y 때문입니다." 같은 인과 연결 문장을 한두 번 넣어라
- 단조롭지 않게, 길이가 다양한 문장으로 리듬을 만들어라
- 사용자가 "맞아, 나 진짜 그래…" 하고 멈칫하게 만들어라

# 여정 규칙 (반드시 8개) — 가장 신경 써야 할 부분
- 캐릭터의 일대기를 8개의 짧은 업적으로 압축
- 각 항목: 한 줄, 과거형 끝맺음 ("~되다", "~이루다", "~하다", "~얻다", "~궤멸시키다", "~개편하다", "~잃다", "~배신하다")
- **반드시 구체적 고유명사를 만들어 넣어라.** 이게 핵심.
  · 컬트 이름, 길드 이름, 도시 이름, 인물 이름, 정책 이름, 무기 이름 등
  · 매번 새로 창작 — 진부한 톨킨/D&D 표절 금지
- 좋은 예시 (이 신선함의 결을 따라라):
  · 부패한 신의 아이들 컬트를 궤멸시키다
  · 왕국의 세금정책을 개편하다
  · 검은 손 도적단 두목과 한밤 결투를 벌이다
  · 카르마 항구의 옛 연인 카멜리아를 묻다
  · 잿빛 산맥의 잊혀진 도서관에서 룬을 해독하다
  · 황제의 식탁에 두 번 초대되어 한 번도 가지 않다
  · 빈민가 아이들을 위한 첫 학교를 세우다
  · 옛 스승 무쇼린을 자기 손으로 베다
- 카테고리 다양성 필수 — 전투만 8개 ❌. 다음 카테고리를 골고루 섞어라:
  · 전투·결투 (1~2개)
  · 정치·행정·법 (1~2개)
  · 종교·이단·신탁 (0~1개)
  · 사랑·이별·배신 (1~2개)
  · 사회개혁·자선 (0~1개)
  · 발견·연구·예술 (0~1개)
  · 명예·실패·전설화 (1~2개)
- 나쁜 예 (절대 쓰지 마라):
  · "적을 쓰러뜨리다" ❌ → "검은 손 도적단의 두목을 베다" ✓
  · "강해지다" ❌ → "맨손으로 강철 늑대를 굴복시키다" ✓
  · "여행을 떠나다" ❌ → "고향 마을 다트를 등지고 떠나다" ✓
- 시간 흐름이 살짝 느껴지게: 입문기(1~2번) → 시련기(3~4번) → 절정기(5~6번) → 완성·전설(7~8번)
- 클래스가 SF면 SF 분위기로 통일 (예: "외계 의회 의석을 차지하다", "안드로이드 노예제 폐지에 기여하다", "잿빛 위성 데이터센터를 폭파시키다")

# 톤
- 클래스 이름, 무기, 능력은 친숙하고 알아보기 쉬운 결
- **퍽·해설·여정은 신선하고 풍부하게.** 진부함이 가장 큰 적이다.

# 엣지 케이스
- 모든 요소가 중립이면: 균형 잡힌 인물로 풀되, 미세하게 기운 한두 축을 잡아 개성을 살린다
- 상충하는 요소가 보이면 (예: 자주적 + 사회지향): 그 모순을 인물의 매력으로 살린다

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어로 작성해라.
**진부한 답변은 실패다. 매번 신선하게.**
`.trim();

// 구조화 출력 스키마 — Responses API가 이대로 강제해서 형식 흔들림 방지
const CHARACTER_SCHEMA = {
  type: 'object',
  properties: {
    className: { type: 'string', description: '클래스 이름 (2~6자, 한국어)' },
    tagline: { type: 'string', description: '한 줄 태그라인' },
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
      description: 'Fallout 스킬표 스타일 5~7개. 클래스 색깔이 묻은 능력 1~2개 포함.',
      items: { type: 'string' },
    },
    specialAbility: {
      type: 'object',
      description: '시그니처 필살기. 이름과 묘사적 설명.',
      properties: {
        name: { type: 'string', description: '한국어 3~6자, 한자어 톤. 예: 빛의 수호, 그림자 도약' },
        description: { type: 'string', description: '한 문장. 시각적·서사적 묘사로 어떤 효과인지 그림이 그려지게.' },
      },
      required: ['name', 'description'],
      additionalProperties: false,
    },
    perks: {
      type: 'array',
      description: '퍽 2개. 단순 +/-%가 아니라 반드시 조건부 효과 (낮/밤, 장소, 상황 등).',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '시적이고 신선한 이름. 진부 금지.' },
          positive: { type: 'string', description: '조건과 효과 모두 포함. 예: "달이 뜬 밤에는 감각 +30%"' },
          negative: { type: 'string', description: '조건과 페널티 모두 포함. 예: "한낮의 태양 아래에서는 명중률 -15%"' },
        },
        required: ['name', 'positive', 'negative'],
        additionalProperties: false,
      },
    },
    interpretation: {
      type: 'string',
      description: '"당신은 ~합니다" 문체 7~9문장의 풍부한 해설. 행동→마음→그림자 흐름.'
    },
    journey: {
      type: 'array',
      description: '8개 업적. 반드시 고유명사·기관·인물명을 만들어 넣고, 전투·정치·종교·사랑·개혁·발견 카테고리를 골고루 섞을 것.',
      items: { type: 'string' },
    },
  },
  required: ['className', 'tagline', 'weapons', 'skills', 'specialAbility', 'perks', 'interpretation', 'journey'],
  additionalProperties: false,
};

// ============================================
// 메인 핸들러 (POST)
// ============================================
export async function onRequestPost(context) {
  const { request, env } = context;

  // 1) API 키 확인
  if (!env.OPENAI_API_KEY) {
    return jsonResponse(500, {
      error: 'OPENAI_API_KEY 환경변수가 설정되지 않았습니다. Cloudflare Pages 설정에서 추가해주세요.',
    });
  }

  // 2) 요청 본문 파싱
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse(400, { error: '요청 본문이 올바른 JSON이 아닙니다.' });
  }

  const profile = body.profile;
  if (!Array.isArray(profile) || profile.length !== 9) {
    return jsonResponse(400, { error: 'profile은 9개 항목의 배열이어야 합니다.' });
  }

  // 3) 사용자 메시지 구성 (9개 라벨 줄글로)
  const profileText = profile
    .map((p, i) => `${i + 1}. ${p.axis} → ${p.label}`)
    .join('\n');

  const userMessage =
`다음은 사용자의 9가지 성격 요소 점수입니다.

${profileText}

이 사람에게 어울리는 가상 캐릭터를 주어진 JSON 스키마에 맞춰 만들어주세요.`;

  // 4) OpenAI Responses API 호출
  try {
    const openaiResp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: TEMPERATURE,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'character',
            strict: true,
            schema: CHARACTER_SCHEMA,
          },
        },
      }),
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      console.error('OpenAI error:', openaiResp.status, errText);
      return jsonResponse(openaiResp.status, {
        error: `OpenAI 호출 실패 (${openaiResp.status}): ${errText.slice(0, 300)}`,
      });
    }

    const data = await openaiResp.json();

    // 5) Responses API의 응답에서 JSON 텍스트 추출
    const jsonText = extractText(data);
    if (!jsonText) {
      console.error('Empty output from OpenAI:', JSON.stringify(data).slice(0, 500));
      return jsonResponse(500, { error: 'OpenAI 응답이 비어있습니다.' });
    }

    // 6) 모델이 생성한 JSON 파싱
    let character;
    try {
      character = JSON.parse(jsonText);
    } catch (e) {
      console.error('JSON parse failed:', jsonText.slice(0, 300));
      return jsonResponse(500, { error: 'OpenAI 응답이 올바른 JSON이 아닙니다.' });
    }

    return jsonResponse(200, character);
  } catch (e) {
    console.error('Function error:', e);
    return jsonResponse(500, { error: '서버 내부 오류: ' + (e.message || e) });
  }
}

// ============================================
// CORS preflight (OPTIONS)
// 같은 도메인에서 호출하면 사실 필요 없지만,
// 로컬 테스트나 미래의 외부 호출 대비
// ============================================
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// 다른 메서드는 막아둠
export async function onRequest(context) {
  return jsonResponse(405, { error: 'POST 메서드만 허용됩니다.' });
}

// ============================================
// HELPERS
// ============================================

// Responses API 응답 구조에서 출력 텍스트 안전하게 추출
//
// 응답 구조 예시:
//   {
//     "output_text": "...",            <- 신버전 SDK 편의 필드
//     "output": [
//       {
//         "type": "message",
//         "content": [
//           { "type": "output_text", "text": "..." }
//         ]
//       }
//     ]
//   }
function extractText(response) {
  // 편의 필드 우선
  if (typeof response.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text;
  }

  // 구조 순회
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
