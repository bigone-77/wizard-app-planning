/// <reference types="vitepress/client" />
import DefaultTheme from "vitepress/theme";
import { inBrowser, type Theme } from "vitepress";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (!inBrowser) return;

    // Mermaid는 늦게 그려지기 때문에, 문서 전체에서 클릭을 감지
    document.addEventListener("click", (e) => {
      const diagram = (e.target as HTMLElement).closest(".vp-doc .mermaid");
      if (!diagram) return;
      const svg = diagram.querySelector("svg");
      if (svg) openZoom(svg);
    });
  },
} satisfies Theme;

async function openZoom(svg: SVGSVGElement) {
  const { default: svgPanZoom } = await import("svg-pan-zoom");

  const overlay = document.createElement("div");
  overlay.className = "mermaid-zoom-overlay";

  const closeBtn = document.createElement("button");
  closeBtn.className = "mermaid-zoom-close";
  closeBtn.textContent = "닫기 (Esc)";

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("style"); // Mermaid가 넣은 max-width 제거
  clone.setAttribute("width", "100%");
  clone.setAttribute("height", "100%");

  overlay.append(clone, closeBtn);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";

  const panZoom = svgPanZoom(clone, {
    zoomEnabled: true,
    controlIconsEnabled: true, // 오른쪽 아래 + / − / 초기화 버튼
    fit: true,
    center: true,
    minZoom: 0.5,
    maxZoom: 20,
  });

  const close = () => {
    panZoom.destroy();
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", onKey);
}
