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
const TEMPERATURE = 1.05;     // 변형 다양성을 위해 살짝 더 올림

const SYSTEM_PROMPT = `
너는 심리테스트 문항을 통해 각 성격 요소를 분석하여, 어울리는 판타지나 SF 속 존재로 가상 캐릭터를 만들어주는 프로그램이야.

# 입력
사용자의 9가지 성격 요소 점수가 라벨로 주어진다.

# 작업
9가지 점수를 종합적으로 읽고, 사용자에게 어울리는 가상 캐릭터를 만든다.
- 누구나 알 만한 친숙한 클래스 결을 유지하되, **다양성 매우 중요**
- 9개 요소를 모두 반영하라. 두세 개만 강조하고 나머지를 흘려보내면 안 된다.
- 같은 점수 조합이라도 매번 다른 각도로 해석할 수 있다.

# 클래스 다양성 (★ 매우 중요)
- **현상금사냥꾼·성기사는 너무 자주 뽑히는 디폴트라 의식적으로 피하라.** 점수가 그 클래스에 100% 들어맞을 때만 선택.
- 점수에 따라 다음 결을 적극 활용하라:
  · 자주+자유+감각 → 도적·암살자·해적·총잡이·닌자
  · 헌신+이상+추상 → 마법사·드루이드·소환사·점성술사·바드
  · 자주+추상+규범 → 비전마법사·룬 학자·연금술사
  · 사회+직관+감각 → 무도가·검사·사무라이·용기사
  · 헌신+이상+규범 → 성기사 (이때만)
  · 자주+계산+실리 → 현상금사냥꾼 (이때만)
  · 헌신+미래+추상 → 네크로맨서·사이오닉·시간 여행자
  · 사회+자유+현재 → 음유시인·바드·해적
- SF 분위기는 SF 점수 조합(추상+계산+미래)일 때 적극 활용
- 같은 클래스라도 변형해라: "추방된 성기사", "회개한 도적", "잠적한 마법사", "은퇴한 검사" 처럼 수식어로 결을 비틀어라

[참고용 클래스 — 위쪽일수록 자주 활용]
판타지: 음유시인, 드루이드, 네크로맨서, 소환사, 무도가, 마검사, 점성술사, 비전마법사, 도적, 암살자, 해적, 사무라이, 닌자, 용기사, 레인저, 마법사, 검사, 전사, 총잡이, 성기사, 현상금사냥꾼
SF: 사이오닉, 해커, 침투요원, 시간 여행자, 사이보그, 안드로이드, 우주 탐사자, 초능력자, 메카 파일럿, 우주 해적, 바운티 헌터

# 무기 규칙 (★ 매우 중요 — 클래스와 반드시 결이 맞아야 함)
- 단순한 "검", "활", "단검"은 식상해서 금지. 반드시 수식어·재질·역사가 붙은 이름으로
- **무기는 클래스 정체성을 결정한다.** 아래 매핑을 반드시 따를 것:
  · 음유시인·바드 → **악기** (류트, 리라, 하프, 작은 북, 풍금) + 단검 / 화살. 검·지팡이 절대 ❌
  · 마법사·비전마법사·점성술사 → 지팡이·룬봉·천문도 + 단검·룬 카드·부적
  · 검사·사무라이·마검사 → 명검·곡도·쌍검 + 단도
  · 도적 → 단검·접이식 칼 + 표창·올가미·잠금장치
  · 암살자 → 독침·소음 단검 + 가는 와이어·연막
  · 해적 → 커틀러스·도끼·단발 화승총 + 갈고리 단검
  · 레인저·사냥꾼 → 활·석궁 + 단검·올가미·짐승 호각
  · 무도가 → 맨손·곤·쌍절곤 + 표창·차크람
  · 닌자 → 닌자도·쿠나이 + 표창·연막탄
  · 성기사 → 양손검·메이스 + 방패·성물
  · 드루이드 → 룬봉·돌도끼·낫 + 약초낭·정령석
  · 네크로맨서·소환사 → 해골 지팡이·낫·소환서 + 단검·고서
  · 총잡이 → 권총·라이플 + 단검·올가미
  · 현상금사냥꾼 → 라이플·석궁 + 단검·표적 표식
  · 용기사 → 창·할버드 + 단도·용 뿔
  · 사이오닉·초능력자 → 정신력 자체(무기 없거나 룬 카드) + 약물·증폭기
  · 해커 → 휴대용 단말기·EMP + 접이식 칼·해킹 도구
  · 침투요원 → 소음권총·전자 후크 + 위장복·해킹 도구
  · 안드로이드·사이보그 → 내장 빔·진동검 + 정찰 드론
- 이름은 반드시 멋스럽게: "새벽의 류트", "잿빛 플레일", "은빛 채찍", "마디 굵은 할버드", "녹슨 단발 라이플", "이름 없는 사슬낫", "옛 왕의 활", "월광 곡도"
- 주무기와 보조무기는 결이 달라야 함 (악기 + 단검, 활 + 단검, 검 + 단도)

# 능력 규칙
- Fallout 스킬표 스타일로 짧은 명사형 5~7개 (사격, 은신, 추적, 검술, 화술, 위장, 룬학 등)
- 너무 흔한 것만 늘어놓지 말고, 클래스 색깔이 묻은 능력 한두 개 끼워라 (예: 룬학, 별점, 해킹, 무영보, 잠항, 호명, 점성, 영매)

# 종족 규칙
- 클래스 결과 잘 어울리는 종족 1개. 판타지 클래스면 판타지 종족, SF면 SF 종족.
- 판타지 종족: 인간, 엘프, 하프엘프, 다크엘프, 하이엘프, 드워프, 노움, 하플링, 티플링, 드래곤본, 오크, 하프오크, 늑대인간, 정령, 천계인
- SF 종족: 인간, 변종, 안드로이드, 사이보그, 외계인(종류 명시), 휴머노이드
- 같은 클래스라도 종족이 다르면 결이 달라짐. 다양하게 골라라.
- 예: 음유시인 → 하프엘프·하플링·인간 / 도적 → 하프링·다크엘프·고블린 / 사이오닉 → 변종·인간·외계인 / 드루이드 → 엘프·노움·인간

# 퍽 규칙 (반드시 2개) — 매우 중요
- 장단점 한 쌍
- **장점과 단점은 반드시 같은 능력치에 영향을 줘야 한다.** 조건만 달라야 함.
- 좋은 예 (같은 능력치, 다른 조건):
  · 빛의 가호: "비 오는 날 마법 +30%" / "맑은 날 마법 -10%"  → 같은 "마법"
  · 광야의 사냥꾼: "야생에서 명중률 +25%" / "도시 안에서 명중률 -15%"  → 같은 "명중률"
  · 군중의 박수: "관중 앞에서 카리스마 +30%" / "단둘이 있을 때 카리스마 -15%"  → 같은 "카리스마"
  · 외골수: "혼자 행동할 때 집중력 +25%" / "동료가 셋 이상 곁에 있을 때 집중력 -20%"  → 같은 "집중력"
  · 보름달 광기: "보름달 뜬 밤 격투력 +35%" / "그믐달 뜬 밤 격투력 -20%"  → 같은 "격투력"
- 나쁜 예 (능력치가 다름):
  · "혼자일 때 집중력 +25%" / "동료 곁에서 판단력 -20%"  ← 집중력 ≠ 판단력 ❌
  · "마법 +30%" / "체력 -10%"  ← 다른 능력치 ❌
- 능력치 종류: 마법, 명중률, 카리스마, 격투, 은신, 회복, 추적, 화술, 정신력, 침착함, 마나 회복, 시야, 회피, 정밀 작업, 집중력, 판단력 등
- 조건의 종류 (섞어서 활용): 시간(낮/밤/보름달), 장소(도시/야생), 상황(혼자/동료곁), 상태(취중/부상), 날씨(비/맑음)
- 이름은 시적이고 신선하게. "외골수", "신중한 손" 같은 흔한 이름 반복 ❌

# 해설 규칙 (★ 중요)
- "당신은 ~합니다." 식의 평어체 2인칭. 8~10문장.
- **단순 성격 나열 금지.** 다음 세 요소를 반드시 모두 포함하여 풍부하게:
  · **상황에서의 행동** — 구체적 상황에서 어떻게 반응하는지 (예: "위기 앞에서 당신은 가장 먼저 사람들의 표정을 살핍니다", "낯선 도시에 들어서면 당신은 가장 먼저 도주로를 찾아둡니다")
  · **동료들의 평가** — 주변 사람이 당신을 어떻게 부르는지 (예: "동료들은 당신을 '따뜻하지만 닿을 수 없는 사람'이라 부릅니다", "사람들은 당신을 '결심한 일은 끝내는 사람'이라 기억합니다")
  · **이상·꿈·갈망** — 당신이 진짜 바라는 것 (예: "당신의 마음 깊은 곳에는 자기 이름 위에 쓰일 한 줄의 문장을 가지고 싶다는 바람이 있습니다", "당신은 누군가에게 안전한 그늘이 되고 싶어합니다")
- 톤: 심리테스트 결과지처럼 따뜻하고 공감적. 사용자가 "맞아, 나 진짜 그래…" 멈칫하게.
- "당신은 X합니다. 그것은 Y 때문입니다." 같은 인과 문장 1~2번 섞기.
- 9가지 점수 요소를 명시적으로 언급하지 말고 자연스럽게 녹여라.

# 여정 규칙 (반드시 5개)
- 캐릭터의 굵직한 5가지 업적/사건만 압축
- 각 항목: 한 줄, 과거형 끝맺음 ("~되다", "~이루다", "~하다", "~잃다")
- 짧고 강렬하게 (10~18자)
- 캐릭터의 클래스·성격·세계관에 어울리는 사건
- 좋은 예: "첫 결투에서 스승을 이기다", "신앙을 버리고 떠나다", "왕의 식탁을 거절하다", "옛 동료를 베다", "잃어버린 이름을 되찾다", "은퇴 후 시골에서 농부가 되다"
- 나쁜 예 (절대 쓰지 마라): "적을 쓰러뜨리다", "강해지다", "여행을 떠나다", "동료를 만나다"
- 카테고리 골고루 섞어라 — 전투만 5개 ❌:
  · 전투·결투 (1~2개)
  · 관계·이별·배신 (1~2개)
  · 신념·결단 (1~2개)
  · 명예·실패·완성 (1개)
- 시간 흐름 살짝: 입문 → 시련 → 절정 → 완성

# 톤
- **퍽·해설·여정은 신선하고 풍부하게.** 진부함이 가장 큰 적이다.

# 엣지 케이스
- 모든 요소가 중립이면: 균형 잡힌 인물로 풀되, 미세하게 기운 한두 축을 잡아 개성을 살린다
- 상충하는 요소가 보이면 (예: 자주적 + 사회지향): 그 모순을 인물의 매력으로 살린다

반드시 주어진 JSON 스키마를 따르고, 모든 텍스트는 한국어로 작성해라.
**진부한 답변은 실패다. 매번 신선하고 다양하게.**
`.trim();

// 구조화 출력 스키마 — Responses API가 이대로 강제해서 형식 흔들림 방지
const CHARACTER_SCHEMA = {
  type: 'object',
  properties: {
    className: { type: 'string', description: '클래스 이름 (2~6자, 한국어)' },
    race: { type: 'string', description: '종족 (인간, 엘프, 하프엘프, 다크엘프, 드워프, 노움, 하플링, 티플링, 드래곤본, 오크, 하프오크, 변종, 안드로이드, 사이보그, 외계인, 정령, 늑대인간 등). 클래스 결과 잘 맞게.' },
    tagline: { type: 'string', description: '한 줄 태그라인' },
    weapons: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: '주무기. 반드시 수식어가 붙은 이름 (예: 새벽의 검, 잿빛 플레일). 단순 "검" 금지.' },
        secondary: { type: 'string', description: '보조무기. 주무기와 다른 결로.' },
      },
      required: ['primary', 'secondary'],
      additionalProperties: false,
    },
    skills: {
      type: 'array',
      description: 'Fallout 스킬표 스타일 5~7개. 클래스 색깔이 묻은 능력 1~2개 포함.',
      items: { type: 'string' },
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
      description: '5개 업적. 짧고 강렬한 과거형 한 줄. 카테고리 다양하게 (전투·관계·신념·완성).',
      items: { type: 'string' },
    },
  },
  required: ['className', 'race', 'tagline', 'weapons', 'skills', 'perks', 'interpretation', 'journey'],
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
