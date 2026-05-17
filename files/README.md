# 운명의 책 — Cloudflare Pages 배포 가이드

심리테스트로 판타지/SF 클래스를 만들어주는 웹 앱.

## 📁 파일 구조

```
spellbook/
├── index.html              ← 페이지 마크업
├── style.css               ← 마법책 스타일
├── app.js                  ← 18문항 + 점수 계산 + API 호출
├── README.md               ← 이 문서
└── functions/
    └── api/
        └── chat.js         ← Cloudflare Pages Function (/api/chat)
```

## 🔐 동작 원리

```
[브라우저]
  ├─ index.html 로딩 (style.css, app.js 함께)
  ├─ 18문항 답변 → 점수 계산 (브라우저 안에서)
  └─ fetch('/api/chat') 호출
        ↓
[Cloudflare Pages Function]
  ├─ env.OPENAI_API_KEY 읽기
  ├─ OpenAI Responses API 호출
  └─ JSON 결과 반환
        ↓
[브라우저]
  └─ 결과 렌더링
```

**핵심**: API 키는 Cloudflare 환경변수에만 존재. HTML/JS 코드 어디에도 없음.

---

## 🚀 배포 단계

### 1단계. OpenAI API 키 발급

1. https://platform.openai.com 회원가입 / 로그인
2. 우측 상단 프로필 → **API keys** → **Create new secret key**
3. 키 이름 적당히 (예: `spellbook`) → 생성
4. **`sk-...`** 키 복사해서 메모장에 저장 (한 번만 보여줌)
5. https://platform.openai.com/settings/organization/billing → **결제 카드 등록 + $5~$10 충전**
   - `gpt-4o-mini` 모델 한 번에 약 0.001~0.003 달러
   - $5 면 수천 번 가능

### 2단계. GitHub 저장소 만들기

1. https://github.com → 가입/로그인
2. **+ → New repository** → 이름 (예: `spellbook`) → **Create**

### 3단계. 코드 업로드

**가장 쉬운 방법 (웹에서 드래그)**

1. 저장소 페이지에서 **"uploading an existing file"** 클릭
2. 이 폴더의 **모든 파일과 폴더**를 한 번에 드래그:
   - `index.html`, `style.css`, `app.js`, `README.md`
   - `functions/` 폴더 (안의 `api/chat.js` 포함, 폴더 구조 유지!)
3. **Commit changes**

**또는 Git 명령어**
```bash
cd spellbook
git init
git add .
git commit -m "초기 배포"
git remote add origin https://github.com/[당신아이디]/spellbook.git
git branch -M main
git push -u origin main
```

### 4단계. Cloudflare Pages 연결

1. https://dash.cloudflare.com → 가입/로그인 (무료)
2. 좌측 메뉴 **Workers & Pages** → **Create application** → **Pages** 탭 → **Connect to Git**
3. GitHub 연동 → 권한 부여 → 방금 만든 저장소 (`spellbook`) 선택
4. **Set up builds and deployments** 페이지에서:
   - **Project name**: 적당히 (예: `spellbook`)
   - **Production branch**: `main`
   - **Framework preset**: **None**
   - **Build command**: (비워둠)
   - **Build output directory**: `/` (또는 비워둠)
   - **Root directory**: `/` (기본값)
5. **Save and Deploy** 클릭
6. 1~2분 기다림 → 사이트 주소 발급 (예: `https://spellbook-abc.pages.dev`)

### 5단계. API 키를 환경변수로 등록 (★ 가장 중요)

배포는 됐지만 아직 OpenAI 키가 없어서 작동 안 함.

1. 방금 만든 프로젝트 → **Settings** 탭
2. 좌측 **Variables and Secrets** (또는 *Environment variables*)
3. **Add** 버튼:
   - **Variable name**: `OPENAI_API_KEY`
   - **Value**: 1단계의 `sk-...` 키 그대로 붙여넣기
   - **Type**: **Secret** (또는 Encrypted) 선택 — 평문 노출 방지
   - **Environment**: **Production** (Preview에도 쓸 거면 둘 다 체크)
4. **Save**

### 6단계. 재배포 (환경변수 반영)

환경변수만 추가하면 자동 반영 안 됨. 재배포 필요.

1. **Deployments** 탭
2. 가장 최근 배포 옆 **⋯** → **Retry deployment**
   - 또는 GitHub에 아무 변경 푸시
3. 1~2분 대기

### 7단계. 접속 테스트

1. 사이트 주소(`https://...pages.dev`) 접속
2. **책을 열다** → 18문항 답변 → 로딩 → 결과 확인
3. 잘 나오면 완료 🎉

---

## ⚙️ 자주 손볼 곳

### 모델 변경 (더 좋은 결과 vs 비용)
`functions/api/chat.js` 상단:
```js
const MODEL = 'gpt-4o-mini'; // ← 'gpt-4o' 로 바꾸면 품질 ↑, 비용 약 10배
```

### 시스템 프롬프트
같은 파일의 `SYSTEM_PROMPT` 상수.

### 출력 스키마
같은 파일의 `CHARACTER_SCHEMA`. 새 필드 추가하려면 여기 + `app.js`의 `renderResult` 양쪽 손보면 됨.

### 문항
`app.js`의 `QUESTIONS` 배열.

### 디자인
`style.css`. CSS 변수가 상단 `:root`에 다 있어서 색만 바꾸면 결이 즉시 달라짐.

코드 수정 후 GitHub에 푸시(또는 업로드)하면 Cloudflare가 자동 재배포.

---

## 🔧 자주 만나는 문제

| 증상 | 원인 / 해결 |
|---|---|
| `OPENAI_API_KEY 환경변수가 설정되지 않았습니다` | 5단계 환경변수 안 추가했거나, 6단계 재배포 안 함 |
| `OpenAI 호출 실패 (401)` | API 키가 잘못/만료됨. 새 키 발급 후 갱신 |
| `OpenAI 호출 실패 (429)` | OpenAI 잔액 부족. https://platform.openai.com/settings/organization/billing 에서 충전 |
| 결과 페이지가 빈 칸 | 모델이 형식을 어김. `gpt-4o`로 모델 변경 권장 |
| Function 호출 자체가 404 | `functions/api/chat.js` 경로가 정확한지 확인. 폴더 구조 그대로 올렸는지 |
| 로딩이 30초 넘어가다가 멈춤 | Cloudflare Pages Functions 무료 플랜은 30초 한도. `gpt-4o-mini` 쓰면 보통 5~15초. |

---

## 💰 비용

### OpenAI
- `gpt-4o-mini`: 1회 약 $0.001~0.003 (1.5~4원)
- `gpt-4o`: 약 10배

### Cloudflare Pages (무료 플랜)
- **요청 수**: 무제한
- **함수 호출**: 하루 100,000회 무료
- **빌드**: 월 500회 무료
- 거의 다 무료로 쓸 수 있음

---

## 📝 라이선스

자유롭게 수정·사용.
