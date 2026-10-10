import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  lang: "ko-KR",
  title: "Wizard App 기획",
  description: "반려동물 앱 기획 문서",
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: "홈", link: "/" },
      { text: "기획 문서", link: "/01-personas-and-scenarios" },
      { text: "유저 플로우", link: "/08-user-flow" },
      { text: "DB 구조", link: "/10-db-schema" },
    ],

    sidebar: [
      {
        text: "기초",
        items: [
          { text: "페르소나와 시나리오", link: "/01-personas-and-scenarios" },
          { text: "반려동물 등록", link: "/02-pet-registration" },
        ],
      },
      {
        text: "시나리오",
        items: [
          { text: "급식 거부", link: "/03-scenario-feeding-refusal" },
          { text: "음성 기록", link: "/04-scenario-voice-logging" },
          { text: "전문가 평가", link: "/05-scenario-expert-evaluation" },
        ],
      },
      {
        text: "정리",
        items: [
          { text: "v0 기능 목록", link: "/06-v0-features" },
          { text: "서비스 한 줄 정의", link: "/07-service-one-liner" },
        ],
      },
      {
        text: "설계",
        items: [
          { text: "유저 플로우", link: "/08-user-flow" },
          { text: "화면 목록", link: "/09-screen-list" },
          { text: "DB 구조", link: "/10-db-schema" },
        ],
      },
    ],

    search: { provider: "local" },
    outline: { level: [2, 3], label: "목차" },
    docFooter: { prev: "이전 문서", next: "다음 문서" },
  },

  mermaid: {
    // 필요하면 Mermaid 옵션을 여기에 추가
  },
  vite: {
    optimizeDeps: {
      include: ["mermaid", "mermaid > dayjs"],
    },
  },
});
