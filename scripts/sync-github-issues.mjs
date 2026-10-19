#!/usr/bin/env node
// =====================================================================
// docs/17-weekly-todo.md 의 표와 GitHub 이슈를 맞춘다 (표 → 이슈, 한 방향)
//
//   pnpm issues:preview                      미리보기 (아무것도 바꾸지 않음)
//   pnpm issues:sync                         실제 동기화
//   PROJECT_NUMBER=4 pnpm issues:sync        새 이슈를 프로젝트 보드에도 추가
//
// 하는 일
//   - 표에 있고 이슈가 없으면 → 생성
//   - 표와 이슈가 다르면 → 제목·라벨·마일스톤·본문(자동 영역) 수정
//   - 표에서 빠지면 → "계획에서 제외됨"으로 닫음 (삭제하지 않음)
//   - 완료되어 닫힌 이슈는 다시 열지 않음
//   - 기존 이슈(ID 없음)는 제목으로 한 번 짝을 찾아 ID를 붙임
//
// 필요: GitHub CLI 로그인 (gh auth login, 보드 추가 시 gh auth refresh -s project)
// =====================================================================
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DRY_RUN =
  process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
const PROJECT_NUMBER = process.env.PROJECT_NUMBER || "";
const PLAN_FILE = process.env.PLAN_FILE || "docs/17-weekly-todo.md";
const PLANNING_SITE =
  process.env.PLANNING_SITE || "https://wizard-app-planning.vercel.app";
const ISSUE_DELAY_MS = Number(process.env.ISSUE_DELAY_MS || 2000);

const REPOS = {
  app: process.env.APP_REPO || "wizard-app",
  backend: process.env.BACKEND_REPO || "wizard-backend",
  planning: process.env.PLANNING_REPO || "wizard-app-planning",
};
const MILESTONES = {
  M1: "M1 기반",
  M2: "M2 첫 흐름",
  M3: "M3 기록",
  M4: "M4 박사",
  M5: "M5 약속·미션·알림",
  M6: "M6 병원 권고·사진·홈",
  M7: "M7 알파 배포",
};
const TYPE_LABELS = {
  Feat: ["a2eeef", "새로운 기능"],
  Settings: ["cfd3d7", "설정"],
  Content: ["fbca04", "콘텐츠 (박사 설명서, 지식, 흐름, 가이드)"],
  Docs: ["0075ca", "문서"],
  Test: ["d4c5f9", "테스트"],
  Decision: ["e99695", "미정 사항 결정"],
  Deploy: ["0e8a16", "배포"],
};
const REMOVED_LABEL = "plan:removed";
const MANAGED_PREFIXES = ["type:", "week:", "plan:"];
const BLOCK_START = "<!-- plan:start -->";
const BLOCK_END = "<!-- plan:end -->";
const ID_RE = /<!-- todo-id: (T\d{3}) -->/;

// ---------- 유틸 ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 순간적인 네트워크 오류·일시 제한이면 다시 시도
const RETRYABLE =
  /connection reset|timeout|timed out|EOF|ECONNRESET|ETIMEDOUT|TLS handshake|50[234]|secondary rate limit|abuse detection/i;
const RETRY_WAITS_MS = [2000, 5000, 10000];
const blockingSleep = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const describe = (args) =>
  args
    .filter((a) => !a.includes("\n"))
    .slice(0, 5)
    .join(" ");

const gh = (args, { mutate = false } = {}) => {
  if (mutate && DRY_RUN) {
    const shown = args.map((a) =>
      a.includes("\n")
        ? `(본문 ${a.length}자)`
        : a.includes(" ")
          ? `"${a}"`
          : a,
    );
    console.log("  [dry-run] gh " + shown.join(" "));
    return "";
  }
  for (let attempt = 0; ; attempt++) {
    try {
      return execFileSync("gh", args, {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
    } catch (e) {
      const msg = `${e.stderr || ""}${e.message || ""}`;
      if (RETRYABLE.test(msg) && attempt < RETRY_WAITS_MS.length) {
        const wait = RETRY_WAITS_MS[attempt];
        console.log(
          `  네트워크 오류, ${wait / 1000}초 뒤 다시 시도 (${attempt + 1}/${RETRY_WAITS_MS.length}): gh ${describe(args)}`,
        );
        blockingSleep(wait);
        continue;
      }
      const reason = (e.stderr || e.message || "")
        .toString()
        .split("\n")
        .filter(Boolean)
        .slice(-2)
        .join(" / ");
      throw new Error(
        `gh ${describe(args)} 실패 — ${reason}\n다시 실행하면 처리한 곳은 건너뛰고 이어서 진행합니다.`,
      );
    }
  }
};
const ghJson = (args) => JSON.parse(gh(args) || "null");
const log = (...a) => console.log(...a);

// ---------- 1. 표 읽기 ----------
function readPlan() {
  const text = readFileSync(PLAN_FILE, "utf8");
  const rows = [];
  const ids = new Set();
  for (const line of text.split("\n")) {
    if (!/^\|\s*T\d{3}\s*\|/.test(line)) continue;
    const cells = line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.length !== 8) throw new Error(`열이 8개가 아닙니다: ${line}`);
    const [id, week, ms, repoKey, type, task, branch, hours] = cells;
    if (ids.has(id)) throw new Error(`ID 중복: ${id}`);
    if (!REPOS[repoKey])
      throw new Error(`알 수 없는 저장소 "${repoKey}": ${id}`);
    if (!MILESTONES[ms]) throw new Error(`알 수 없는 마일스톤 "${ms}": ${id}`);
    if (!TYPE_LABELS[type]) throw new Error(`알 수 없는 유형 "${type}": ${id}`);
    ids.add(id);
    rows.push({
      id,
      week,
      ms,
      repo: REPOS[repoKey],
      type,
      task,
      branch,
      hours,
    });
  }
  if (rows.length === 0)
    throw new Error(`표에서 할 일을 찾지 못했습니다: ${PLAN_FILE}`);
  return rows;
}

// ---------- 2. 이슈 내용 만들기 ----------
const titleOf = (r) => `[${r.week}] ${r.task}`;
const labelsOf = (r) => [`type:${r.type}`, `week:${r.week}`];
function blockOf(r) {
  const branch = r.branch === "-" ? "없음 (코드 작업 아님)" : `\`${r.branch}\``;
  return [
    BLOCK_START,
    `<!-- todo-id: ${r.id} -->`,
    `- ID: ${r.id}`,
    `- 주차: ${r.week}`,
    `- 마일스톤: ${MILESTONES[r.ms]}`,
    `- 예상 시간: ${r.hours}시간`,
    `- 브랜치: ${branch}`,
    "",
    "참고 문서",
    `- 주차별 할 일: ${PLANNING_SITE}/17-weekly-todo`,
    `- 마일스톤 완료 기준: ${PLANNING_SITE}/15-dev-plan`,
    `- 아키텍처·형식 약속: ${PLANNING_SITE}/16-architecture`,
    "",
    "PR 본문에 `Closes #이슈번호`를 적으면 dev에 합칠 때 이슈가 닫힙니다.",
    "_이 영역은 docs/17-weekly-todo.md 에서 자동으로 만들어집니다. 메모는 이 영역 밖이나 댓글에 적어주세요._",
    BLOCK_END,
  ].join("\n");
}
function mergeBody(oldBody, block) {
  const body = (oldBody || "").replace(/\r\n/g, "\n");
  const s = body.indexOf(BLOCK_START);
  const e = body.indexOf(BLOCK_END);
  if (s !== -1 && e !== -1 && e > s) {
    return body.slice(0, s) + block + body.slice(e + BLOCK_END.length);
  }
  // 자동 영역이 없는 예전 이슈: 예전 본문도 스크립트가 만든 것이므로 통째로 교체
  return block;
}

// ---------- 3. GitHub 상태 읽기 ----------
function loadRepo(repoFull) {
  const issues = ghJson([
    "issue",
    "list",
    "--repo",
    repoFull,
    "--state",
    "all",
    "--limit",
    "1000",
    "--json",
    "number,title,body,state,stateReason,labels,milestone,url",
  ]);
  const labels = new Set(
    ghJson([
      "label",
      "list",
      "--repo",
      repoFull,
      "--limit",
      "500",
      "--json",
      "name",
    ]).map((l) => l.name),
  );
  const milestones = new Set(
    ghJson(["api", `repos/${repoFull}/milestones?state=all&per_page=100`]).map(
      (m) => m.title,
    ),
  );
  return { issues, labels, milestones };
}

async function main() {
  const owner = process.env.OWNER || gh(["api", "user", "--jq", ".login"]);
  log(
    `GitHub 아이디: ${owner}${DRY_RUN ? "  (미리보기 — 아무것도 바꾸지 않음)" : ""}`,
  );

  const rows = readPlan();
  log(`표에서 할 일 ${rows.length}개를 읽었습니다.\n`);

  const repoNames = [...new Set(Object.values(REPOS))];
  const state = {};
  for (const name of repoNames) state[name] = loadRepo(`${owner}/${name}`);

  // ID → 이슈 (모든 저장소)
  const byId = new Map();
  for (const name of repoNames) {
    for (const issue of state[name].issues) {
      const m = ID_RE.exec(issue.body || "");
      if (m) byId.set(m[1], { repo: name, issue });
    }
  }

  const stats = {
    created: 0,
    updated: 0,
    unchanged: 0,
    removed: 0,
    moved: 0,
    linked: 0,
  };

  // ---------- 4. 라벨·마일스톤 준비 ----------
  for (const name of repoNames) {
    const full = `${owner}/${name}`;
    const needLabels = new Map();
    for (const [t, [color, desc]] of Object.entries(TYPE_LABELS))
      needLabels.set(`type:${t}`, [color, desc]);
    for (const r of rows)
      needLabels.set(`week:${r.week}`, ["ededed", `주차 ${r.week}`]);
    needLabels.set(REMOVED_LABEL, [
      "000000",
      "계획에서 제외됨 (17-weekly-todo)",
    ]);
    for (const [label, [color, desc]] of needLabels) {
      if (state[name].labels.has(label)) continue;
      log(`라벨 생성: ${name} · ${label}`);
      gh(
        [
          "label",
          "create",
          label,
          "--repo",
          full,
          "--color",
          color,
          "--description",
          desc,
          "--force",
        ],
        { mutate: true },
      );
    }
    const needMs = new Set(
      rows.filter((r) => r.repo === name).map((r) => MILESTONES[r.ms]),
    );
    for (const title of needMs) {
      if (state[name].milestones.has(title)) continue;
      log(`마일스톤 생성: ${name} · ${title}`);
      gh(["api", `repos/${full}/milestones`, "-f", `title=${title}`], {
        mutate: true,
      });
    }
  }

  // ---------- 5. 표 → 이슈 ----------
  const planIds = new Set(rows.map((r) => r.id));

  for (const r of rows) {
    const full = `${owner}/${r.repo}`;
    let found = byId.get(r.id);

    // 예전 이슈(ID 없음): 같은 저장소에서 제목으로 짝 찾기
    if (!found) {
      const match = state[r.repo].issues.find(
        (i) => !ID_RE.test(i.body || "") && i.title === titleOf(r),
      );
      if (match) {
        found = { repo: r.repo, issue: match };
        stats.linked++;
        log(`ID 연결: ${r.id} ↔ ${r.repo}#${match.number}`);
      }
    }

    // 저장소가 바뀐 경우: 기존 이슈 닫고 새로 생성
    if (found && found.repo !== r.repo) {
      const old = found.issue;
      if (old.state === "OPEN") {
        log(`저장소 이동: ${r.id} ${found.repo}#${old.number} → ${r.repo}`);
        gh(
          [
            "issue",
            "close",
            String(old.number),
            "--repo",
            `${owner}/${found.repo}`,
            "--reason",
            "not planned",
            "--comment",
            `${r.repo} 저장소로 옮겨졌습니다 (17-weekly-todo).`,
          ],
          { mutate: true },
        );
      }
      stats.moved++;
      found = null;
    }

    if (!found) {
      log(`생성: ${r.repo} · ${titleOf(r)}`);
      const url = gh(
        [
          "issue",
          "create",
          "--repo",
          full,
          "--title",
          titleOf(r),
          "--body",
          blockOf(r),
          "--label",
          labelsOf(r).join(","),
          "--milestone",
          MILESTONES[r.ms],
        ],
        { mutate: true },
      );
      if (url) log(`  ${url}`);
      if (PROJECT_NUMBER && url) {
        gh(
          [
            "project",
            "item-add",
            PROJECT_NUMBER,
            "--owner",
            owner,
            "--url",
            url,
          ],
          { mutate: true },
        );
        log(`  프로젝트 #${PROJECT_NUMBER} 에 추가`);
      }
      stats.created++;
      if (!DRY_RUN) await sleep(ISSUE_DELAY_MS);
      continue;
    }

    // 수정이 필요한지 비교
    const issue = found.issue;
    const args = [];
    const changes = [];
    if (issue.title !== titleOf(r)) {
      args.push("--title", titleOf(r));
      changes.push("제목");
    }
    const newBody = mergeBody(issue.body, blockOf(r));
    if ((issue.body || "").replace(/\r\n/g, "\n").trim() !== newBody.trim()) {
      args.push("--body", newBody);
      changes.push("본문");
    }
    if ((issue.milestone?.title || "") !== MILESTONES[r.ms]) {
      args.push("--milestone", MILESTONES[r.ms]);
      changes.push("마일스톤");
    }

    const current = issue.labels
      .map((l) => l.name)
      .filter((n) => MANAGED_PREFIXES.some((p) => n.startsWith(p)));
    const desired = labelsOf(r);
    const add = desired.filter((l) => !current.includes(l));
    const remove = current.filter((l) => !desired.includes(l));
    if (add.length) {
      args.push("--add-label", add.join(","));
      changes.push("라벨+");
    }
    if (remove.length) {
      args.push("--remove-label", remove.join(","));
      changes.push("라벨-");
    }

    // 계획에서 뺐다가 다시 넣은 경우에만 다시 연다 (완료된 이슈는 열지 않음)
    const wasRemoved =
      issue.state === "CLOSED" &&
      issue.labels.some((l) => l.name === REMOVED_LABEL);
    if (wasRemoved) {
      log(`다시 열기: ${r.repo}#${issue.number} (계획에 다시 포함)`);
      gh(["issue", "reopen", String(issue.number), "--repo", full], {
        mutate: true,
      });
    }

    if (args.length) {
      log(`수정: ${r.repo}#${issue.number} ${r.id} [${changes.join(", ")}]`);
      gh(["issue", "edit", String(issue.number), "--repo", full, ...args], {
        mutate: true,
      });
      stats.updated++;
      if (!DRY_RUN) await sleep(500);
    } else {
      stats.unchanged++;
    }
  }

  // ---------- 6. 표에서 빠진 할 일 → 닫기 ----------
  for (const [id, { repo, issue }] of byId) {
    if (planIds.has(id) || issue.state !== "OPEN") continue;
    log(`계획에서 제외: ${repo}#${issue.number} ${id}`);
    gh(
      [
        "issue",
        "edit",
        String(issue.number),
        "--repo",
        `${owner}/${repo}`,
        "--add-label",
        REMOVED_LABEL,
      ],
      { mutate: true },
    );
    gh(
      [
        "issue",
        "close",
        String(issue.number),
        "--repo",
        `${owner}/${repo}`,
        "--reason",
        "not planned",
        "--comment",
        "계획(17-weekly-todo)에서 제외되었습니다.",
      ],
      { mutate: true },
    );
    stats.removed++;
  }

  log(
    `\n완료. 생성 ${stats.created} · 수정 ${stats.updated} · 그대로 ${stats.unchanged} · 제외 ${stats.removed} · 이동 ${stats.moved} · ID 연결 ${stats.linked}`,
  );
}

main().catch((e) => {
  console.error(`\n에러: ${e.message}`);
  process.exit(1);
});
