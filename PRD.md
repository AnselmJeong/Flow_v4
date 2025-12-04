아래는 요청하신 내용을 **모두 반영한 최신 PRD (Electron + React + Gemini 2.5 Flash + Context-bound Chat Session Design 포함)**이다.
 특히 **“텍스트 selection 단위로 새로운 AI 세션이 생성되고, 해당 세션은 독립된 context memory를 갖는다”**는 핵심 기능을 전체 구조에 완전히 녹여냈다.

------

# 📘 **Product Requirements Document (PRD — Electron + React + Gemini 버전)**

**Product Name:** *AI Enhanced Reader (가칭)*
 **Platform:** macOS Desktop
 **Framework:** **Electron + React**
 **LLM Provider:** **Google Gemini 2.5 Flash**
 **Version:** 1.0 (MVP)
 **Last Updated:** 2025-12-04

------

# 1. 📌 Product Summary

AI Enhanced Reader는 PDF/EPUB 전자책을 읽는 과정에서
 사용자가 텍스트를 선택하면 → 이를 기반으로 **독립된 AI 대화 세션(Conversation)**이 생성된다.

이 세션은 사용자가 선택한 원문 텍스트를 **세션의 “공통 context (persistent context)”**로 유지하며,
 이후 사용자가 질문을 추가로 입력하면
 **항상 동일한 selection-context 기반으로 AI 응답을 연속 생산**한다.

만약 사용자가 다른 문장을 선택하면
 📌 **완전히 새로운 AI 세션이 생성되며**
 기존 세션과는 **독립적으로 저장·조회**된다.

Gemini 2.5 Flash를 이용하여 빠르고 정확한 요약/번역/해설/철학적 질문 응답이 가능하며,
 각 세션은 **책 단위로 DB에 영구 저장**된다.

Electron + React 기반으로 개발하여 개발 난이도를 낮추고 안정성과 확장성을 확보한다.

------

# 2. 🧭 Goals & Non-Goals

## Goals

- PDF/EPUB Reader의 Robust UI
- Selection → 새로운 AI 세션 생성
- 동일 selection-context에 기반한 연속 대화 흐름 유지
- 세션별 독립 저장
- Library / Reader / Chat UI 통합
- Gemini 2.5 Flash 기반 빠른 AI 응답

## Non-Goals

- Multi-device sync
- DRM 지원
- On-device LLM
- Audio TTS/ASR

------

# 3. 👤 Target Users

- 학술서적을 많이 읽는 연구자
- 정신의학·철학 등 난해한 문장을 AI에게 즉시 설명받고 싶은 사용자
- 논문 읽기 + 요약/해설 워크플로우 구축이 필요한 사람

------

# 4. 📂 User Stories (Updated with Session-based Context)

1. 사용자가 문장을 선택하고 “요약/번역/질문”을 누르면
    **새로운 독립 AI 세션이 생성된다.**
2. 이후 사용자가 같은 세션 창에서 질문을 추가 입력하면,
    **초기에 선택된 텍스트가 지속적으로 conversation context로 유지**되어야 한다.
3. 사용자가 다른 문장을 선택해 “질문”을 누르면
    **전혀 다른 세션이 새로 생기고**, 기존 세션과 섞이지 않는다.
4. Library에서 과거 책을 다시 열면
    책마다 진행했던 여러 AI 세션을 왼쪽 패널에서 확인하고
    원하는 세션을 다시 불러올 수 있어야 한다.
5. Read → Select → New Chat Session → Save → Read → Select → New Chat Session
    이런 워크플로우가 자연스럽게 수행되어야 한다.

------

# 5. 🧱 Functional Requirements (FR)

## **FR1 — Import System**

- PDF/EPUB 드래그 앤 드롭 지원
- 파일을 내부 저장소 `~/Library/AIEnhancedReader/books/<uuid>/`로 복사
- Metadata(PDF metadata / EPUB OPF) 추출 후 DB 저장

------

## **FR2 — Reader (PDF/EPUB)**

- Two-page view
- Page number jump
- Text selection layer
- Selection event를 React renderer로 전달

------

## ✨ **FR3 — Context-bound AI Chat Session (핵심 기능)**

### ✔ FR3.1 — “Selection → New Chat Session”

- 사용자가 문장을 선택하면 floating bubble 표시
  - 요약
  - 번역
  - 질문하기
- 사용자가 이를 선택하면:
  1. 새로운 Chat Session 생성
  2. 선택된 텍스트가 `session.base_context`로 저장됨
  3. Chat Panel이 열린다
  4. 첫 질문 메시지가 자동 입력되어 Gemini API 호출됨

### ✔ FR3.2 — Persistent Base Context

- Chat Session의 모든 후속 메시지는 다음 prompt 구조를 유지:

```
Base Context (선택된 원문 텍스트)
+
User Follow-up Question
```

예:

```
[Base context]
"Bergson describes natural science as a partial view..."

[User question]
이게 무슨 의미야?
```

세션이 끝날 때까지 base context는 절대 변하지 않는다.

### ✔ FR3.3 — Multiple Independent Sessions

- 다른 문장을 선택하면
   → 새로운 session_id 생성
   → 기존 세션과 완전히 분리

### ✔ FR3.4 — Session Left Sidebar UI

- 왼쪽 패널에서 아래 UI 유지 (첨부 이미지와 같은 구조):

```
대화 기록
 ├ Session 1: "Bergson describes..."
 ├ Session 2: "He thinks the importance..."
 ├ Session 3: "But this is not the terra..."
 ...
```

각 세션을 클릭하면 그 세션의:

- base context
- 모든 message history
   가 다시 로드된다.

------

## **FR4 — DB persistence (updated for session model)**

### New table: `chat_sessions`

| id(uuid) | book_id | base_context(text) | created_at | updated_at |

### Updated `chat_messages`

| id | session_id | role(user/assistant) | message | created_at |

### Relations

- book 1 : N chat_sessions
- chat_session 1 : N chat_messages

------

## **FR5 — Chat Panel (React UI)**

- base_context 는 상단 고정 box로 표시
- 대화 메시지 리스트
- Gemini 2.5 Flash 응답 표시
- markdown 지원
- 각 메시지 저장(추가 질문 시 DB update)

------

## **FR6 — Settings**

- Gemini API Key 저장
- 모델 선택(2.5 Flash, Flash-lite 등)
- Theme(light/dark)

------

# 6. 🔧 Technical Architecture (Electron + React)

## Stack

- Electron main process
- React renderer
- PDF.js, epub.js
- SQLite (better-sqlite3)
- Gemini 2.5 Flash API (REST or Node SDK)

------

## IPC

| Channel             | Purpose                   |
| ------------------- | ------------------------- |
| import-file         | pdf/epub import           |
| open-book           | metadata + file path 전달 |
| create-chat-session | base_context 생성         |
| post-chat-message   | Gemini API 호출           |
| load-session        | session history 로드      |
| save-message        | DB insert/update          |

------

# 7. 📑 Database Schema (Revised)

### books

- id
- title
- author
- file_path
- last_page

### chat_sessions

- id
- book_id
- base_context
- created_at
- updated_at

### chat_messages

- id
- session_id
- role (user/assistant)
- message
- created_at

### highlights (선택사항)

- id
- book_id
- text
- page/cfi

------

# 8. 🎨 UI/UX Requirements

### Reader

- two-page layout
- clear selection overlay
- float bubble with actions

### Chat Panel

- base_context 박스 상단 고정
- session messages 표시
- 세션별 independent message history
- 왼쪽 패널에 “세션 목록” 표시(그림처럼)

### Library UI

- 책 grid
- 최신순 / 제목순
- 검색

------

# 9. 🔄 User Flow (Updated)

### Case 1: 첫 selection → 세션 시작

- 텍스트 선택
- “질문하기”
- 새로운 session 생성
- base_context 저장
- Gemini 호출
- 이후 follow-up 질문은 같은 session_id 유지

### Case 2: 다른 문장 selection → 새로운 세션

- 새로운 base_context
- session_id 새로 발급
- 독립된 chat history 생성

### Case 3: 책 다시 열기

- 왼쪽 패널에서 기존 session 선택
- base_context + history 로드

