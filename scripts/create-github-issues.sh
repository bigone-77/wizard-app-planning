#!/usr/bin/env bash
# =====================================================================
# docs/17-weekly-todo.md 의 표를 읽어 GitHub에 마일스톤·라벨·이슈를 만든다.
#
# 사용법 (wizard-app-planning 저장소 루트에서):
#   pnpm issues:preview                     # 미리보기 (아무것도 만들지 않음)
#   pnpm issues:create                      # 실제로 생성
#   PROJECT_NUMBER=<번호> pnpm issues:create # 프로젝트 보드에도 추가
#
#   직접 실행: bash scripts/create-github-issues.sh [--dry-run]
#   OWNER를 지정하지 않으면 gh에 로그인한 아이디를 사용한다
#
# 준비:
#   - GitHub CLI 설치 후 로그인:  gh auth login
#   - 프로젝트 보드에 추가하려면: gh auth refresh -s project
#   - 저장소 세 개가 GitHub에 있어야 함: wizard-app, wizard-backend, wizard-app-planning
#
# 여러 번 실행해도 안전하다. 같은 제목의 이슈, 같은 이름의 마일스톤·라벨은 다시 만들지 않는다.
# =====================================================================
set -euo pipefail

PROJECT_NUMBER="${PROJECT_NUMBER:-}"
DRY_RUN="${DRY_RUN:-0}"
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) echo "알 수 없는 옵션: $arg (사용 가능: --dry-run)" >&2; exit 1 ;;
  esac
done

command -v gh >/dev/null || { echo "GitHub CLI(gh)가 필요합니다: brew install gh" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh auth login 을 먼저 해주세요" >&2; exit 1; }

# OWNER를 지정하지 않으면 로그인한 아이디 사용
OWNER="${OWNER:-$(gh api user --jq .login)}"
echo "GitHub 아이디: $OWNER"
PLAN_FILE="${PLAN_FILE:-docs/17-weekly-todo.md}"

APP_REPO="${APP_REPO:-wizard-app}"
BACKEND_REPO="${BACKEND_REPO:-wizard-backend}"
PLANNING_REPO="${PLANNING_REPO:-wizard-app-planning}"
PLANNING_SITE="${PLANNING_SITE:-https://wizard-app-planning.vercel.app}"

[[ -f "$PLAN_FILE" ]] || { echo "계획 파일이 없습니다: $PLAN_FILE (저장소 루트에서 실행하세요)" >&2; exit 1; }

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    local out="[dry-run]" a
    for a in "$@"; do out="$out \"$a\""; done
    echo "$out"
  else
    "$@"
  fi
}

repo_of() {
  case "$1" in
    app) echo "$APP_REPO" ;;
    backend) echo "$BACKEND_REPO" ;;
    planning) echo "$PLANNING_REPO" ;;
    *) echo "알 수 없는 저장소: $1" >&2; exit 1 ;;
  esac
}

milestone_title() {
  case "$1" in
    M1) echo "M1 기반" ;;
    M2) echo "M2 첫 흐름" ;;
    M3) echo "M3 기록" ;;
    M4) echo "M4 박사" ;;
    M5) echo "M5 약속·미션·알림" ;;
    M6) echo "M6 병원 권고·사진·홈" ;;
    M7) echo "M7 알파 배포" ;;
    *) echo "알 수 없는 마일스톤: $1" >&2; exit 1 ;;
  esac
}

# --- 1. 표 읽기: 첫 칸이 W01~W99 인 줄만 ---------------------------------
ROWS=()
while IFS= read -r line; do
  ROWS+=("$line")
done < <(grep -E '^\| W[0-9]{2} \|' "$PLAN_FILE")

[[ ${#ROWS[@]} -gt 0 ]] || { echo "계획 표에서 할 일을 찾지 못했습니다" >&2; exit 1; }
echo "할 일 ${#ROWS[@]}개를 찾았습니다."

trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"; printf '%s' "$s"; }

# 사용하는 저장소·마일스톤·주차 모으기 (macOS 기본 bash 3.2 호환: 연관 배열 미사용)
REPO_LIST=""; MS_LIST=""; WEEK_LIST=""
for row in "${ROWS[@]}"; do
  IFS='|' read -r _ week ms repo _rest <<< "$row"
  week=$(trim "$week"); ms=$(trim "$ms"); repo=$(trim "$repo")
  r=$(repo_of "$repo")
  REPO_LIST="$REPO_LIST$r"$'\n'
  MS_LIST="$MS_LIST$r|$ms"$'\n'
  WEEK_LIST="$WEEK_LIST$week"$'\n'
done
REPOS=$(printf '%s' "$REPO_LIST" | sort -u)
MILESTONE_KEYS=$(printf '%s' "$MS_LIST" | sort -u)
WEEKS=$(printf '%s' "$WEEK_LIST" | sort -u)

# --- 2. 라벨 ---------------------------------------------------------------
TYPE_LABELS=(
  "type:Feat|a2eeef|새로운 기능"
  "type:Settings|cfd3d7|설정"
  "type:Content|fbca04|콘텐츠 (박사 설명서, 지식, 흐름, 가이드)"
  "type:Docs|0075ca|문서"
  "type:Test|d4c5f9|테스트"
  "type:Decision|e99695|미정 사항 결정"
  "type:Deploy|0e8a16|배포"
)

for r in $REPOS; do
  echo "== $OWNER/$r 라벨"
  for spec in "${TYPE_LABELS[@]}"; do
    IFS='|' read -r name color desc <<< "$spec"
    run gh label create "$name" --repo "$OWNER/$r" --color "$color" --description "$desc" --force
  done
  for w in $WEEKS; do
    run gh label create "week:$w" --repo "$OWNER/$r" --color "ededed" --description "주차 $w" --force
  done
done

# --- 3. 마일스톤 -----------------------------------------------------------
while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  r="${key%%|*}"; ms="${key##*|}"
  title=$(milestone_title "$ms")
  if [[ "$DRY_RUN" != "1" ]] && \
     gh api "repos/$OWNER/$r/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$title"; then
    echo "마일스톤 있음: $r · $title"
    continue
  fi
  echo "== $OWNER/$r 마일스톤: $title"
  if [[ "$DRY_RUN" == "1" ]]; then
    run gh api "repos/$OWNER/$r/milestones" -f title="$title"
  else
    gh api "repos/$OWNER/$r/milestones" -f title="$title" \
      -f description="15 개발 계획의 $ms 완료 기준 참고: $PLANNING_SITE/15-dev-plan" >/dev/null
  fi
done <<< "$MILESTONE_KEYS"

# --- 4. 이슈 ---------------------------------------------------------------
for row in "${ROWS[@]}"; do
  IFS='|' read -r _ week ms repo type task branch hours _ <<< "$row"
  week=$(trim "$week"); ms=$(trim "$ms"); repo=$(trim "$repo")
  type=$(trim "$type"); task=$(trim "$task"); branch=$(trim "$branch"); hours=$(trim "$hours")

  r=$(repo_of "$repo")
  title="[$week] $task"
  ms_title=$(milestone_title "$ms")

  if [[ "$DRY_RUN" != "1" ]]; then
    exists=$(gh issue list --repo "$OWNER/$r" --state all --limit 500 --json title \
             --jq ".[] | select(.title == \"${title//\"/\\\"}\") | .title" || true)
    if [[ -n "$exists" ]]; then
      echo "이슈 있음: $r · $title"
      continue
    fi
  fi

  branch_line="- 브랜치: \`$branch\`"
  [[ "$branch" == "-" ]] && branch_line="- 브랜치: 없음 (코드 작업 아님)"

  body=$(cat <<EOF
- 주차: $week
- 마일스톤: $ms_title
- 예상 시간: ${hours}시간
$branch_line

참고 문서
- 주차별 할 일: $PLANNING_SITE/17-weekly-todo
- 마일스톤 완료 기준: $PLANNING_SITE/15-dev-plan
- 아키텍처·형식 약속: $PLANNING_SITE/16-architecture

PR 본문에 \`Closes #이슈번호\`를 적으면 dev에 합칠 때 이슈가 닫힙니다.
EOF
)

  echo "== $OWNER/$r 이슈: $title"
  if [[ "$DRY_RUN" == "1" ]]; then
    run gh issue create --repo "$OWNER/$r" --title "$title" --label "type:$type" --label "week:$week" --milestone "$ms_title" --body "(본문 생략)"
    continue
  fi

  url=$(gh issue create --repo "$OWNER/$r" --title "$title" --body "$body" \
          --label "type:$type" --label "week:$week" --milestone "$ms_title")
  echo "   $url"

  if [[ -n "$PROJECT_NUMBER" ]]; then
    gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" >/dev/null
    echo "   프로젝트 #$PROJECT_NUMBER 에 추가"
  fi
done

echo "완료."