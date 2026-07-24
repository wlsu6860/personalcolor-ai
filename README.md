# 컬러핏 — AI 퍼스널컬러 진단 MVP

사진 한 장을 업로드하면 Claude Vision이 웜톤/쿨톤 + 세부 시즌 타입을 분석해주는 웹앱입니다.

## 시작하기

1. `.env.local.example`을 `.env.local`로 복사하고, [console.anthropic.com](https://console.anthropic.com)에서 발급받은 API 키를 넣습니다.

   ```bash
   cp .env.local.example .env.local
   ```

2. 의존성 설치 (최초 1회, 이미 완료됨):

   ```bash
   npm install
   ```

3. 개발 서버 실행:

   ```bash
   npm run dev
   ```

4. 브라우저에서 http://localhost:3000 접속

## 지금 구현된 것 / 안 된 것

**구현됨**
- 랜딩 페이지 → 사진 업로드 → 이름 입력 → AI 분석 → 무료 요약 + 잠긴 상세 리포트 퍼널
- Claude Vision API로 실시간 사진 분석 (`app/api/analyze/route.ts`)

**아직 안 됨 (직접 진행 필요)**
- **결제 연동**: "상세 리포트 보기" 버튼은 현재 안내 알림만 뜹니다. 실제 결제(토스페이먼츠 등)는 사업자 등록 + PG 계약 후 연동해야 합니다.
- **회원가입/로그인, 결과 저장**: 지금은 매번 새로 분석만 가능합니다.
- **배포**: 로컬에서만 실행됩니다. Vercel 등에 배포하려면 `ANTHROPIC_API_KEY`를 배포 환경 변수로 등록해야 합니다.
- **사업자 등록/통신판매업 신고**: 유료 판매 시 법적으로 필요합니다.

## 폴더 구조

```
app/
  page.tsx                # 랜딩 페이지
  diagnose/page.tsx        # 업로드→분석→결과 퍼널 (클라이언트 컴포넌트)
  api/analyze/route.ts     # Claude Vision 호출 API
lib/
  personalColor.ts          # 타입 정의 + AI 시스템 프롬프트
```
