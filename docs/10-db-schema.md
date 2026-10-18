# 10. DB 구조

> 상태: **완성 (2026-10-07)**, V0 알파 범위 반영 (2026-10-18)
> 다음 단계: 와이어프레임

이 문서는 데이터를 **무엇을, 왜** 이렇게 저장하기로 했는지를 다룬다.

---

## 한눈에 보기

**테이블 17개**

| 영역        | 테이블                                    | 역할                                                       |
| ----------- | ----------------------------------------- | ---------------------------------------------------------- |
| 사용자      | `profiles`                                | 경험 수준, 알림 시간, 시간대                               |
| 기준 데이터 | `species`, `species_morphs`               | 종 정보·체중 기준, 종별 모프 선택지                        |
| 앱 설정     | `app_config`                              | 배포 없이 바꾸는 운영 값 (박사 하루 예산, 개체 수 상한 등) |
| 개체        | `pets`, `pet_conditions`, `photos`        | **신분증**: 개체 정보, 특이사항, 사진                      |
| 기록        | `care_records`                            | **일기장**: 먹이·배변·체중·탈피·관찰                       |
| 박사        | `conversations`, `ai_messages`            | 대화와 메시지                                              |
|             | `follow_ups`, `missions`, `mission_items` | 박사의 약속, 적응 미션과 날짜별 항목                       |
| 알림        | `device_tokens`                           | 푸시 알림을 받을 기기                                      |
| 사용량      | `ai_usage_daily`                          | 사용자별 박사 하루 예산 사용량                             |
| 지식        | `knowledge_sources`, `knowledge_chunks`   | 박사가 참고하는 자료와 출처                                |

---

## ERD

```mermaid
erDiagram
    auth_users ||--|| profiles : "1:1"
    profiles ||--o{ pets : "owns"
    profiles ||--o{ conversations : "starts"
    profiles ||--o{ device_tokens : "registers"
    profiles ||--o{ ai_usage_daily : "uses"
    species ||--o{ species_morphs : "has"
    species ||--o{ pets : "is"
    species ||--o{ knowledge_chunks : "about"
    knowledge_sources ||--o{ knowledge_chunks : "cites"

    pets ||--o{ pet_conditions : "has"
    pets ||--o{ photos : "has"
    pets ||--o{ care_records : "records"
    pets |o--o{ conversations : "about"
    pets ||--o{ follow_ups : "has"
    pets ||--o{ missions : "has"

    conversations ||--o{ ai_messages : "contains"
    conversations |o--o{ follow_ups : "promised in"
    conversations |o--o{ care_records : "produced"
    missions ||--o{ mission_items : "contains"
    pet_conditions }o--o| photos : "evidence"
    care_records |o--o{ follow_ups : "resolves"
    care_records |o--o{ mission_items : "completes"

    profiles {
        uuid id PK "auth.users.id"
        text experience_level "pre_adoption | beginner | experienced"
        time feeding_time "알림 시간"
        text timezone
        int ai_daily_budget_override "테스터용, -1 무제한"
    }
    species {
        text id PK "fat_tailed_gecko"
        text name_ko
        text name_en
        text scientific_name
        numeric typical_weight_max_g "체중 확인 질문 기준"
        boolean is_active
    }
    species_morphs {
        text id PK "fat_tailed_gecko.whiteout"
        text species_id FK
        text name_ko
        int sort_order
        boolean is_active
    }
    app_config {
        text key PK "ai_daily_budget, max_pets_per_user"
        jsonb value
        text description
    }
    pets {
        uuid id PK "UUIDv7"
        uuid user_id FK
        text species_id FK
        text name "1~20자"
        text sex "male | female | unknown"
        date hatch_date "nullable"
        text size_stage "hatchling | subadult | adult"
        date adopted_at
        text adoption_source_type
        text main_feeder_type
        text morphs "text 배열"
        timestamptz archived_at "보관"
    }
    pet_conditions {
        uuid id PK "UUIDv7"
        uuid pet_id FK
        text category
        text body_part
        text note
        uuid photo_id FK "nullable"
    }
    photos {
        uuid id PK "UUIDv7"
        uuid pet_id FK
        text storage_path "pet_id/photo_id.jpg"
        text photo_type
        boolean is_baseline
        text retention "permanent | temporary"
        timestamptz expires_at
        jsonb validation
    }
    care_records {
        uuid id PK "UUIDv7, 앱에서 생성"
        uuid pet_id FK
        uuid conversation_id FK "질문 흐름 출처"
        text type "feeding | defecation | weight | shed | observation"
        timestamptz occurred_at
        text source "user | stt | adoption_info | question_flow | mission"
        boolean is_uncertain
        text raw_text "STT 원문"
        jsonb data "종류별 내용"
    }
    conversations {
        uuid id PK "UUIDv7"
        uuid user_id FK
        uuid pet_id FK "온보딩 대화는 null"
        text kind
        text summary
    }
    ai_messages {
        uuid id PK "UUIDv7"
        uuid conversation_id FK
        text role "doctor | user"
        text type "text | choice | hospital | mission | log_confirm"
        jsonb payload
        text source_ids "text 배열"
        text flow_node_id "사전 설계 흐름"
    }
    follow_ups {
        uuid id PK "UUIDv7"
        uuid pet_id FK
        text reason
        text resolves_on
        timestamptz due_at
        timestamptz notified_at "푸시 발송 시각"
        text status
        uuid resolved_by_record_id FK
    }
    missions {
        uuid id PK "UUIDv7"
        uuid pet_id FK
        text title
        date start_date
        date end_date "최대 30일"
        text status
    }
    mission_items {
        uuid id PK "UUIDv7"
        uuid mission_id FK
        uuid pet_id FK "미션과 동일 보장"
        date due_date
        text time_of_day
        text linked_record_type
        timestamptz completed_at
        timestamptz notified_at
    }
    device_tokens {
        uuid id PK "UUIDv7"
        uuid user_id FK
        text token UK
        text provider "expo | fcm"
        text platform "ios | android"
    }
    ai_usage_daily {
        uuid user_id PK
        date usage_date PK
        int used_units "글 1 · 사진 3"
    }
    knowledge_sources {
        text id PK
        text title
        text url
        text source_type
        boolean is_active
    }
    knowledge_chunks {
        text id PK "ftg-012"
        text species_id FK "null = 공통"
        text source_id FK
        text topic
        text content
        boolean is_contested "의견 갈림"
        boolean is_active
    }
```

---

## 설계 원칙

| 원칙             | 내용                                                        | 이유                                                           |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| 확장성           | 총 사용자 100만 규모에서도 구조 변경 없이 확장              | 나중에 바꾸기 어려운 것은 지금, 쉽게 붙는 것은 나중에          |
| 기록 통합        | 먹이·배변·체중·탈피·관찰을 **한 테이블**에 종류로 구분      | 기록 목록, 음성 다중 기록, 이상 감지가 모두 "기록 전체"를 다룸 |
| 권한은 개체 기준 | 데이터의 주인은 **개체를 통해** 확인                        | 나중에 개체 소유권 이전·가족 공유가 생겨도 한 곳만 수정        |
| 기록자 분리      | 각 기록에 "누가 남겼는지" 별도 저장                         | 가족 공유 시 "엄마가 남긴 기록" 구분                           |
| 시간             | 날짜 계산은 **사용자 시간대** 기준                          | 자정 근처 기록, 해외 확장                                      |
| 삭제 대신 보관   | 개체는 보관, 지식 자료는 비활성화                           | 추억 보존, 과거 답변의 참고 자료 유지                          |
| DB가 지킨다      | 잘못된 데이터는 앱이 아니라 **DB가 최종적으로 막음**        | 앱에 버그가 있어도 데이터가 오염되지 않음                      |
| 로딩 없는 앱     | 화면을 먼저 바꾸고 저장은 뒤에서 (기록 ID를 앱이 미리 생성) | 사용자가 기다리는 순간 제거                                    |

---

## 영역별 핵심

### 사용자

- V0(알파)는 **로그인한 사용자만** 앱을 사용 (08). 계정이 생기면 프로필이 자동으로 만들어짐
- 익명 로그인은 V0에서 사용하지 않음 (확장 대비: 정식 출시 때 계정 없이 시작 검토)
- 사용자 닉네임은 받지 않음. 박사는 "**○○ 집사**"로 부름 (개체 이름 활용)

### 개체 — 신분증

- 나이: 생년월일 또는 크기 단계 중 하나는 필수
- **V0는 회원당 1마리** — 상한은 `app_config.max_pets_per_user = 1`로 DB가 보장 (확장 대비: 값만 바꾸면 여러 마리)
- **보관**: 무지개다리·입양 보냄 시 삭제 대신 보관
  - 기록·사진은 추억으로 남고, 홈·박사 대화에서는 빠짐
  - 진행 중인 박사의 약속·미션은 자동 종료, 새 기록 불가
  - 보관된 개체에 대한 알림은 절대 가지 않음
- 사진 파일은 개체별 폴더에 저장, 개체·계정 삭제 시 함께 정리

### 기록 — 일기장

박사가 개체에 대해 아는 정보는 두 곳에서 온다.

| 테이블         | 정보                                            | 비유                           |
| -------------- | ----------------------------------------------- | ------------------------------ |
| `pets`         | 이름, 종, 나이, 성별, 모프, 분양일, 특이사항    | **신분증**: 누구인지           |
| `care_records` | 먹이, 배변, 체중, 탈피, 관찰 (시간에 따라 쌓임) | **일기장**: 무슨 일이 있었는지 |

| 종류 | 저장 내용                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 먹이 | 먹이 종류, 수량(선택), **결과** (먹음 / 안 먹음 / 조금 먹음 / 모름), **영양제 더스팅**(선택: 칼슘 / 칼슘+D3 / 종합비타민 / 안 묻힘) |
| 배변 | 상태 (정상 / 묽음 / 물 같음 / 모름), 이상 소견 (피·점액·소화 안 된 먹이)                                                            |
| 체중 | 그램                                                                                                                                |
| 탈피 | 상태 (완료 / 진행 중 / 껍질 남음)                                                                                                   |
| 관찰 | 박사 질문에 대한 답 (예: 바닥 온도 "따뜻함")                                                                                        |

- 모든 기록에 **출처**(직접 입력 / 음성 / 분양 정보 / 박사 질문 / 미션)와 **불확실 여부** 저장
- 분양 시 받은 정보(마지막 급여일 등)와 첫 체중도 입양 전 기록으로 여기에 저장
- **체중 오입력**: DB는 명백한 오류(20kg 초과)만 막고, 흔한 실수(19.2g → 192g)는 박사가 "지난번엔 19.0g이었는데 192g 맞아?"라고 확인
- 분양일 이전 날짜의 일반 기록, 미래 시각 기록은 막음
- **영양제는 먹이 기록에 포함**: 펫테일은 먹이에 칼슘·D3 가루를 묻혀 주는(더스팅) 방식이라, 같은 행동을 기록 한 건으로 남김 ("귀뚜라미 세 마리 칼슘 묻혀서 줬어" → 기록 1건)
  - 박사는 기록을 보고 빠진 영양제를 가볍게 짚어줌 ("최근엔 칼슘만 줬네, 다음엔 D3 들어간 걸로 줘볼까?")
  - 먹이와 무관한 영양제 관리(상시 칼슘 그릇 등)가 필요해지면 별도 기록 종류로 추가 (구조 변경 없음)

### 박사

- **개체 없는 대화**: 1B 긴급 점검은 로그인 후, 개체 등록 전에 일어남 → 대화는 개체 없이도 존재 가능. 등록 직후 대화를 개체에 연결하고 점검 답변을 관찰 기록으로 옮김
- **메시지는 수정·삭제 불가**. 박사 메시지는 미리 설계한 질문 흐름이거나 서버의 LLM 답변만 가능 → 사용자가 박사의 말을 위조할 수 없음
- 선택지 답변은 "어떤 질문에 어떤 답을 골랐는지"를 사용자 메시지로 남김
- **약속**: 개체당 진행 중인 약속은 하나. 새 약속이 생기면 기존 약속은 자동 대체. 해당 기록이 들어오면 자동 해결 ("먼저 알려줬네!")
- **미션**: 개체당 진행 중인 미션은 하나, 최대 30일. 날짜별 항목으로 저장하고, 미션 체크 대신 일반 기록을 남겨도 자동 체크

### 알림 — 서버 푸시

- 알림은 기기가 아니라 **서버가 보냄** → 사용자의 모든 기기에 도착, 재설치·기기 변경에도 영향 없음
- 보내기 직전에 약속 상태를 확인 → **해결된 약속, 보관된 개체에는 알림이 갈 수 없는 구조**
- 같은 알림이 두 번 가지 않음
- 같은 기기에서 다른 계정으로 로그인하면 알림도 새 계정 기준으로 바뀜

### 박사 하루 예산

LLM 비용이 운영비의 대부분이라 사용자별 **하루 예산**을 둔다. 대형 AI 서비스(Claude, Gemini)처럼 메시지 개수가 아니라 **비용 기준**으로 센다.

| 사용                                                              | 차감                          |
| ----------------------------------------------------------------- | ----------------------------- |
| 박사 글 대화 1회                                                  | 1                             |
| 사진 분석 1회                                                     | 3                             |
| 수의사 질문 생성 (Should)                                         | 1                             |
| **위험 신호 확인 흐름, 병원 권고, 진료 요약·PDF, 기록 시점 검사** | **0 (LLM 미사용, 항상 가능)** |

| 설정             | 위치                                | V0 (알파)                                           |
| ---------------- | ----------------------------------- | --------------------------------------------------- |
| 하루 예산        | `app_config.ai_daily_budget`        | 테스터 피드백을 위해 넉넉하게 (수치는 비용 측정 후) |
| 차감 가중치      | `app_config`                        | 글 1 · 사진 3                                       |
| 테스터 개별 설정 | `profiles.ai_daily_budget_override` | 필요 시 무제한(-1)                                  |

- 하루 기준은 사용자 시간대의 날짜
- 예산을 다 써도 박사는 "오늘 자세한 이야기는 여기까지지만, 위험한 신호인지는 지금 같이 확인해볼게"로 사전 설계 흐름을 안내
- 확장 대비: 무료/유료 예산 분리에 같은 구조 사용

### 지식

박사가 커지는 지식을 감당하는 3단계.

| 단계   | 방식                                | 언제                 |
| ------ | ----------------------------------- | -------------------- |
| 1 (V0) | 해당 종의 자료 전부를 박사에게 전달 | 자료가 적을 때       |
| 2      | 주제로 먼저 거르고 관련 자료만      | 자료가 많아질 때     |
| 3      | 의미 검색 (RAG)                     | 종·자료가 크게 늘 때 |

- 출처와 자료 조각을 분리 → 링크가 바뀌어도 한 곳만 수정, "참고 자료 보기"에서 출처별로 묶어 표시
- **의견이 갈리는 주제** 표시 → 박사가 "이건 의견이 갈리는 부분이야"라고 균형 있게 답변 (05 품질 기준)
- LLM이 존재하지 않는 참고 자료를 지어내면 저장 시 자동으로 걸러짐

---

## 서버가 하는 일

| 작업           | 언제                 | 내용                                                        |
| -------------- | -------------------- | ----------------------------------------------------------- |
| 박사 대화      | 사용자가 질문할 때   | 사용량 확인 → 답변 생성 → 저장                              |
| 기록 시점 검사 | 기록 저장 후         | 최근 기록으로 이상 여부 판단 → 박사 반응 (04)               |
| 음성 기록      | 녹음 완료 후         | 음성을 글로 바꾸고 기록 초안으로 정리 (저장은 확인 카드 후) |
| 알림 발송      | 1분마다              | 시간이 된 약속·미션 알림 발송                               |
| 일일 정리      | 하루 1회             | 만료된 임시 사진, 버려진 사진 파일 정리                     |
| 계정 삭제      | 사용자 요청 시 (S13) | 사진 파일과 모든 데이터 즉시 삭제 (**Apple 심사 요건**)     |

---

## 테이블로 만들지 않은 것

| 항목                                | 어디에                       | 이유                         |
| ----------------------------------- | ---------------------------- | ---------------------------- |
| 질문 흐름, 입양 전 가이드, 읽을거리 | 앱 안에 내장                 | 서버를 거치지 않아 즉시 표시 |
| 진료용 기록 요약                    | 병원 권고 메시지에 함께 저장 | 권고 시점의 기록 상태 보존   |
| 사진 파일                           | 파일 저장소                  | 테이블엔 사진 정보만         |

**나중에 추가될 것**: 가족 공유, 사육장 정보, 지식 의미 검색(RAG)

---

## 예외 상황 처리

DB가 막아주는 주요 상황들.

| 영역   | 상황                                                | 처리                                                             |
| ------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| 사용자 | 다른 사람의 데이터 조회·수정                        | 차단 (보이지 않음)                                               |
|        | 사용자가 자기 박사 한도를 변경                      | 차단                                                             |
| 개체   | 나이 정보 없음, 출생일 > 분양일, 미래 날짜, 빈 이름 | 저장 거부                                                        |
|        | 두 번째 개체 등록 (V0 1마리)                        | 차단                                                             |
|        | 개체를 다른 사람에게 넘기기                         | 차단                                                             |
|        | 남의 개체 폴더에 사진 업로드                        | 차단                                                             |
| 기록   | 같은 기록이 재시도로 두 번 전송                     | 한 번만 저장                                                     |
|        | 음성으로 여러 기록 저장 중 하나가 잘못됨            | 전부 저장 안 됨 (일부만 저장되는 일 없음)                        |
|        | 필수값 누락, 숫자 자리에 글자                       | 저장 거부                                                        |
|        | 보관된 개체에 기록, 기록을 다른 개체로 이동         | 차단                                                             |
|        | 분양일 이전 일반 기록                               | 거부 → 분양일 수정 안내                                          |
| 박사   | 박사 메시지 위조                                    | 차단                                                             |
|        | 약속·미션이 동시에 두 개                            | 자동 대체 / 차단                                                 |
|        | 알림 전에 먼저 기록                                 | 약속 자동 해결, 알림 안 감                                       |
| 알림   | 보관된 개체·해결된 약속 알림                        | 발송 안 됨                                                       |
|        | 같은 알림 중복 발송                                 | 발생 안 함                                                       |
| 사용량 | 하루 예산 초과                                      | "오늘 자세한 이야기는 여기까지" + **위험 신호 확인은 계속 가능** |
| 지식   | 존재하지 않는 참고 자료                             | 자동 제거                                                        |

> 실제 PostgreSQL 환경에서 위 상황들을 시나리오 75개로 검증 완료.
