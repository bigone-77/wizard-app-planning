# 17. 주차별 할 일

> 기준: 주 18시간, 15 개발 계획의 마일스톤(M1~M7)을 주 단위로 나눔 → **약 14주**
> 이 문서의 표가 GitHub 이슈의 원본이다. `scripts/create-github-issues.sh`가 이 표를 읽어 이슈를 만든다
> 주차는 목표치다. 마일스톤의 완료 기준(15)을 채우는 것이 우선이고, M2가 끝날 때 속도를 보고 조정한다

---

## 표 읽는 법

| 열       | 값                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| 주       | `W01` ~ `W14`                                                                                                    |
| 마일스톤 | `M1` ~ `M7` (15 개발 계획)                                                                                       |
| 저장소   | `app` = wizard-app · `backend` = wizard-backend · `planning` = wizard-app-planning                               |
| 유형     | `Feat` 기능 · `Settings` 설정 · `Content` 콘텐츠 · `Docs` 문서 · `Test` 테스트 · `Decision` 결정 · `Deploy` 배포 |
| 브랜치   | 작업 브랜치 이름. 코드가 없는 일은 `-`                                                                           |

- 두 저장소에 걸친 일은 저장소별로 나눠 적었다. 같은 브랜치 이름을 쓰고 **backend → app** 순서로 합친다
- 표의 열 순서와 구분자(`|`)를 바꾸면 스크립트가 읽지 못한다

---

## W01 · M1 준비와 백엔드

| 주  | 마일스톤 | 저장소   | 유형     | 할 일                                                                                                     | 브랜치                    | 시간 |
| --- | -------- | -------- | -------- | --------------------------------------------------------------------------------------------------------- | ------------------------- | ---- |
| W01 | M1       | planning | Settings | Apple 개발자 계정 신청, Expo 계정 생성                                                                    | -                         | 1    |
| W01 | M1       | planning | Settings | 개발 환경 설치: Docker Desktop, Xcode·iOS 시뮬레이터, Android Studio·Google Play 에뮬레이터               | -                         | 2    |
| W01 | M1       | backend  | Settings | Supabase init, 초기 마이그레이션 로컬 적용 확인                                                           | feature/m1-supabase-setup | 2    |
| W01 | M1       | backend  | Feat     | V0 반영 마이그레이션: 익명 로그인 정리, 개체 1마리 상한, 비용 단위 예산, 기록 data 검증(dusting·abnormal) | feature/m1-v0-migration   | 6    |
| W01 | M1       | backend  | Test     | RLS·트리거·제약 SQL 테스트 기본 세팅 (10 예외 상황 일부)                                                  | feature/m1-db-tests       | 3    |
| W01 | M1       | backend  | Settings | dev 프로젝트 생성, link, db push                                                                          | -                         | 1    |
| W01 | M1       | planning | Content  | 즉시 병원 신호 목록 초안 (14 최우선)                                                                      | -                         | 3    |

## W02 · M1 앱 기반

| 주  | 마일스톤 | 저장소   | 유형     | 할 일                                                                  | 브랜치                   | 시간 |
| --- | -------- | -------- | -------- | ---------------------------------------------------------------------- | ------------------------ | ---- |
| W02 | M1       | app      | Settings | Expo 프로젝트 생성, 개발 빌드로 iOS·안드로이드 실행                    | feature/m1-project-setup | 4    |
| W02 | M1       | app      | Settings | 16장 폴더 뼈대, 하단 탭 4개 빈 화면                                    | feature/m1-project-setup | 2    |
| W02 | M1       | app      | Decision | 스타일 라이브러리 결정, 디자인 토큰 초안 (간격·글자 크기·색 이름)      | feature/m1-design-tokens | 3    |
| W02 | M1       | app      | Settings | 환경 변수(local·dev), Supabase 클라이언트, TanStack Query, UUIDv7 유틸 | feature/m1-auth          | 3    |
| W02 | M1       | app      | Feat     | 이메일 로그인(개발 빌드 전용), 세션 유지, 이동 규칙 1단계 (S01)        | feature/m1-auth          | 4    |
| W02 | M1       | app      | Settings | db:types 스크립트, DB 타입 생성                                        | feature/m1-auth          | 1    |
| W02 | M1       | planning | Content  | 즉시 병원 신호 목록 검토·보완                                          | -                        | 1    |

## W03 · M2 첫 흐름 (1)

| 주  | 마일스톤 | 저장소   | 유형    | 할 일                                                         | 브랜치                  | 시간 |
| --- | -------- | -------- | ------- | ------------------------------------------------------------- | ----------------------- | ---- |
| W03 | M2       | app      | Feat    | 박사 인사(S02), 3갈래 선택, 경험 수준 저장                    | feature/m2-greeting     | 4    |
| W03 | M2       | app      | Feat    | 입양 전 가이드(S03), 입양 준비 상태 홈                        | feature/m2-pre-adoption | 4    |
| W03 | M2       | planning | Content | 입양 전 가이드 콘텐츠: 준비물 체크리스트, 분양 시 질문 리스트 | -                       | 3    |
| W03 | M2       | app      | Feat    | 개체 등록(S04) 폼과 검증, 숙련자 선택 항목 펼침               | feature/m2-pet-register | 5    |
| W03 | M2       | app      | Docs    | 사전 설계 흐름 JSON 형식 정의와 zod 스키마 (16장 16.5)        | feature/m2-flow-schema  | 2    |

## W04 · M2 첫 흐름 (2) + 속도 점검

| 주  | 마일스톤 | 저장소   | 유형 | 할 일                                           | 브랜치                  | 시간 |
| --- | -------- | -------- | ---- | ----------------------------------------------- | ----------------------- | ---- |
| W04 | M2       | app      | Feat | 분양 정보를 입양 전 기록으로 저장               | feature/m2-pet-register | 2    |
| W04 | M2       | app      | Feat | 기본 홈(S06): 개체 이름, 최근 기록 자리         | feature/m2-home-basic   | 4    |
| W04 | M2       | app      | Feat | 앱 실행 이동 규칙 전체 (08)                     | feature/m2-routing      | 3    |
| W04 | M2       | app      | Feat | 개체 정보(S11) 보기·수정                        | feature/m2-pet-info     | 3    |
| W04 | M2       | backend  | Test | 개체 등록·1마리 상한·날짜 검증 SQL 테스트       | feature/m2-pet-tests    | 2    |
| W04 | M2       | app      | Feat | 소셜 로그인(애플·구글), dev 프로젝트에서 테스트 | feature/m2-social-login | 3    |
| W04 | M2       | planning | Docs | 속도 점검: M1~M2 실제 시간 기록, 이후 주차 조정 | -                       | 1    |

## W05 · M3 텍스트 기록

| 주  | 마일스톤 | 저장소  | 유형 | 할 일                                                  | 브랜치                     | 시간 |
| --- | -------- | ------- | ---- | ------------------------------------------------------ | -------------------------- | ---- |
| W05 | M3       | app     | Feat | 형식 약속 zod 스키마: 기록 data, 메시지 payload (16장) | feature/m3-contracts       | 2    |
| W05 | M3       | app     | Feat | 기록하기(S07) 텍스트 입력, 확인 카드, 낙관적 저장      | feature/m3-record-text     | 6    |
| W05 | M3       | app     | Feat | 기록 목록(S10) 수정·삭제                               | feature/m3-record-list     | 4    |
| W05 | M3       | backend | Feat | evaluate-record 함수 뼈대, 규칙 판정 구조              | feature/m3-evaluate-record | 6    |

## W06 · M3 기록 시점 검사

| 주  | 마일스톤 | 저장소   | 유형     | 할 일                                               | 브랜치                     | 시간 |
| --- | -------- | -------- | -------- | --------------------------------------------------- | -------------------------- | ---- |
| W06 | M3       | planning | Content  | 기록 시점 검사 기준값 확정 (14 확정 필요 수치)      | -                          | 3    |
| W06 | M3       | backend  | Feat     | evaluate-record V0 규칙 완성(04)과 단위 테스트      | feature/m3-evaluate-record | 6    |
| W06 | M3       | app      | Feat     | 저장 → 검사 연결, 박사 한두 줄 반응, 같은 ID 재시도 | feature/m3-evaluate-record | 5    |
| W06 | M3       | app      | Decision | STT 서비스 결정 (한국어 정확도, 비용)               | -                          | 4    |

## W07 · M3 음성 기록

| 주  | 마일스톤 | 저장소  | 유형 | 할 일                                              | 브랜치                  | 시간 |
| --- | -------- | ------- | ---- | -------------------------------------------------- | ----------------------- | ---- |
| W07 | M3       | backend | Feat | voice-record 함수: STT, 구조화 출력, 초안 반환     | feature/m3-voice-record | 8    |
| W07 | M3       | app     | Feat | 녹음 UI, 초안 → 확인 카드 → 여러 기록 한 번에 저장 | feature/m3-voice-record | 8    |
| W07 | M3       | app     | Test | 음성 기록 완료 기준 확인 (기록 2건 저장 등)        | feature/m3-voice-record | 2    |

## W08 · M4 박사 화면과 사전 설계 흐름

| 주  | 마일스톤 | 저장소   | 유형    | 할 일                                                         | 브랜치                 | 시간 |
| --- | -------- | -------- | ------- | ------------------------------------------------------------- | ---------------------- | ---- |
| W08 | M4       | app      | Feat    | 박사 대화(S08): 메시지 타입, 하단 칩, 첫 화면 추천 질문 칩    | feature/m4-doctor-ui   | 6    |
| W08 | M4       | app      | Feat    | 사전 설계 흐름 실행기, RED_FLAG 예약 노드, 관찰 기록 저장     | feature/m4-flow-engine | 5    |
| W08 | M4       | planning | Content | 흐름 내용: 긴급 점검, 거식, 위험 신호, 배변 확인, 발가락 확인 | -                      | 5    |
| W08 | M4       | app      | Feat    | 1B 긴급 점검 연결, 개체 등록 후 대화·관찰 기록 연결           | feature/m4-flow-engine | 2    |

## W09 · M4 병원 권고와 박사 콘텐츠

| 주  | 마일스톤 | 저장소   | 유형     | 할 일                                               | 브랜치              | 시간 |
| --- | -------- | -------- | -------- | --------------------------------------------------- | ------------------- | ---- |
| W09 | M4       | app      | Feat     | 병원 권고(S09): 권고, 진료 요약 화면, 지도 바로가기 | feature/m4-hospital | 5    |
| W09 | M4       | planning | Content  | 박사 설명서 작성, 채팅창에서 정답지 10개로 시험     | -                   | 5    |
| W09 | M4       | planning | Content  | 지식 자료 작성 (정답지 주제부터)                    | -                   | 6    |
| W09 | M4       | planning | Decision | LLM 서비스·모델 결정 (정답지 시험 결과, 비용, 속도) | -                   | 2    |

## W10 · M4 박사 대화

| 주  | 마일스톤 | 저장소  | 유형 | 할 일                                                             | 브랜치                 | 시간 |
| --- | -------- | ------- | ---- | ----------------------------------------------------------------- | ---------------------- | ---- |
| W10 | M4       | backend | Feat | doctor-chat: 위험 신호 확인, 예산, 상황 블록, 출력 검증, 스트리밍 | feature/m4-doctor-chat | 10   |
| W10 | M4       | app     | Feat | 스트리밍 표시, 예산 소진 안내 → 위험 확인, 참고 자료 보기         | feature/m4-doctor-chat | 6    |
| W10 | M4       | backend | Test | 정답지 평가 실행, 통과 기준 확인 (12)                             | feature/m4-doctor-eval | 2    |

## W11 · M5 미션과 약속

| 주  | 마일스톤 | 저장소   | 유형     | 할 일                                               | 브랜치              | 시간 |
| --- | -------- | -------- | -------- | --------------------------------------------------- | ------------------- | ---- |
| W11 | M5       | backend  | Feat     | doctor-chat 결론에서 약속·미션 생성                 | feature/m5-missions | 3    |
| W11 | M5       | app      | Feat     | 적응 미션, 홈 미션 카드, 흐름 결론의 약속·미션 생성 | feature/m5-missions | 5    |
| W11 | M5       | app      | Feat     | 기록으로 약속 자동 해결 반응 ("먼저 알려줬네!")     | feature/m5-missions | 2    |
| W11 | M5       | planning | Content  | 지식 자료 나머지 주제                               | -                   | 4    |
| W11 | M5       | app      | Settings | 푸시 인증 설정: APNs 키, FCM, Expo 액세스 토큰      | feature/m5-push     | 4    |

## W12 · M5 서버 푸시

| 주  | 마일스톤 | 저장소  | 유형 | 할 일                                                       | 브랜치          | 시간 |
| --- | -------- | ------- | ---- | ----------------------------------------------------------- | --------------- | ---- |
| W12 | M5       | backend | Feat | send-notifications 함수, pg_cron 등록 마이그레이션          | feature/m5-push | 8    |
| W12 | M5       | app     | Feat | 토큰 등록, 약속 시점 권한 요청, 알림 시간, 알림 진입 라우팅 | feature/m5-push | 8    |
| W12 | M5       | backend | Test | 발송 선점·보관 개체 미발송·중복 미발송 확인                 | feature/m5-push | 2    |

## W13 · M6 병원 권고·사진·홈

| 주  | 마일스톤 | 저장소  | 유형 | 할 일                                                        | 브랜치                    | 시간 |
| --- | -------- | ------- | ---- | ------------------------------------------------------------ | ------------------------- | ---- |
| W13 | M6       | app     | Feat | 진료 요약 PDF 내보내기·공유                                  | feature/m6-vet-pdf        | 4    |
| W13 | M6       | app     | Feat | 기준 사진(S05): 실루엣 가이드, 압축, 업로드                  | feature/m6-baseline-photo | 5    |
| W13 | M6       | app     | Feat | 홈 완성: 박사 한마디·추천 질문 칩, 개체 요약 숫자, 다음 체크 | feature/m6-home           | 5    |
| W13 | M6       | backend | Feat | delete-account 함수                                          | feature/m6-account-delete | 2    |
| W13 | M6       | app     | Feat | 설정(S13): 경험 수준, 알림 시간, 계정 삭제                   | feature/m6-account-delete | 2    |

## W14 · M7 알파 배포

| 주  | 마일스톤 | 저장소  | 유형     | 할 일                                                      | 브랜치              | 시간 |
| --- | -------- | ------- | -------- | ---------------------------------------------------------- | ------------------- | ---- |
| W14 | M7       | backend | Feat     | daily-cleanup 함수                                         | feature/m7-cleanup  | 3    |
| W14 | M7       | app     | Feat     | 박사 답변 👍 / 👎                                          | feature/m7-feedback | 2    |
| W14 | M7       | backend | Settings | 운영 프로젝트 생성, 운영 secrets, 알파 박사 예산 설정      | -                   | 2    |
| W14 | M7       | app     | Settings | EAS 프로필(development·preview·production), 버전·빌드 번호 | feature/m7-eas      | 2    |
| W14 | M7       | app     | Test     | 버그 수정, 평가 재실행, 처음 설치부터 첫 기록까지 점검     | -                   | 5    |
| W14 | M7       | app     | Deploy   | release/v0.1.0 → main, TestFlight·Play 내부 테스트 배포    | -                   | 4    |

---

## 합계

| 마일스톤             | 주       | 시간    |
| -------------------- | -------- | ------- |
| M1 기반              | W01–W02  | 36      |
| M2 첫 흐름           | W03–W04  | 36      |
| M3 기록              | W05–W07  | 54      |
| M4 박사              | W08–W10  | 54      |
| M5 약속·미션·알림    | W11–W12  | 36      |
| M6 병원 권고·사진·홈 | W13      | 18      |
| M7 알파 배포         | W14      | 18      |
| **합계**             | **14주** | **252** |

> 여유분을 각 주에 나눠 넣었기 때문에 15의 어림값(약 215시간)보다 크다

---

## GitHub Projects 사용법

1. GitHub에서 **Project** 하나 생성 (Board 보기)
2. 칸: `Backlog` → `이번 주` → `진행 중` → `리뷰` → `완료`
3. `scripts/create-github-issues.sh` 실행 → 세 저장소에 마일스톤 M1~M7, 라벨, 이슈 생성 + 프로젝트에 추가
4. 보드에서 `week:W01` 라벨로 필터 → 이번 주 할 일을 `이번 주` 칸으로
5. 이슈에서 브랜치 생성 → PR 본문에 `Closes #번호` → `dev`에 합치면 이슈 닫힘
