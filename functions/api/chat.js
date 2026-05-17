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
- Fallout 스킬표 스타일로 짧은 명사형 5~7개 (사격, 은신, 추적, 검술, 화술 등)

# 퍽 규칙 (반드시 2개)
- Fallout 트레잇처럼 좋은 점과 나쁜 점을 함께 가진다
- 각각 구체적 수치 포함 (예: +25%, -15%)
- 이름은 한국어로 멋있게 (외골수, 신중한 손, 폭풍의 카리스마 등)

# 해설 규칙
- 반드시 "당신은 ~합니다." 식의 평어체 2인칭으로 작성
- 심리테스트 결과지처럼 따뜻하고 공감적으로
- "당신은 X합니다. 그것은 Y 때문입니다." 같은 흐름으로 행동과 그 안의 마음을 짚어준다
- 9가지 요소를 명시적으로 언급하지 말고 자연스럽게 녹여라
- 4~6줄 분량
- 사용자가 "맞아, 나 그래" 하고 느끼게

# 여정 규칙 (당신의 여정 — 반드시 8개)
- 캐릭터의 일대기를 8개의 짧은 업적 형식으로 압축한다
- 각 항목은 한 줄, 과거형 명사구로 끝맺음 ("~되다", "~이루다", "~하다", "~얻다", "~만나다")
- Steam 업적처럼 짧고 강렬하게 (대략 8~18자, 너무 길지 않게)
- 캐릭터의 클래스·성격·세계관에 어울리는 구체적 사건
- 좋은 예: "갱단의 리더가 되다", "지하도시 혁명을 일으키다", "잃어버린 가문의 명예를 되찾다", "별의 신탁을 받아내다", "폭풍의 항구에서 첫 부하를 얻다"
- 나쁜 예 (너무 일반적): "적을 쓰러뜨리다", "강해지다", "여행을 떠나다"
- 시간 흐름을 살짝 느끼게: 입문 → 첫 시련 → 성장 → 동료/적과의 만남 → 절정 → 완성/전설화
- 클래스가 SF면 SF 분위기, 판타지면 판타지 분위기로 통일

# 톤
- 클래스 이름, 무기, 능력 모두 친숙하고 알아보기 쉬운 결
- 해설은 추켜세우거나 깎아내리지 말고, 있는 그대로 짚어주는 따뜻한 어조

# 엣지 케이스
- 모든 요소가 중립이면: 균형 잡힌 인물로 풀되, 미세하게 기운 한두 축을 잡아 개성을 살린다
- 상충하는 요소가 보이면 (예: 자주적 + 사회지향): 그 모순을 인물의 매력으로 살린다

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어로 작성해라.
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
      description: 'Fallout 스킬표 스타일 5~7개',
      items: { type: 'string' },
    },
    perks: {
      type: 'array',
      description: '퍽 2개 (장단점 모두 포함)',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          positive: { type: 'string', description: '+수치% 형식의 장점' },
          negative: { type: 'string', description: '-수치% 형식의 단점' },
        },
        required: ['name', 'positive', 'negative'],
        additionalProperties: false,
      },
    },
    interpretation: { type: 'string', description: '"당신은 ~합니다" 문체 4~6줄 해설' },
    journey: {
      type: 'array',
      description: '캐릭터 일대기를 압축한 8개의 업적 형식 한 줄. 과거형, 구체적, 입문→성장→절정 흐름.',
      items: { type: 'string' },
    },
  },
  required: ['className', 'tagline', 'weapons', 'skills', 'perks', 'interpretation', 'journey'],
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
