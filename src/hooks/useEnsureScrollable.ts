import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function unlockDocumentScroll() {
  // Se existir modal aberto (Radix coloca aria-modal="true"), não forçamos unlock
  if (document.querySelector('[aria-modal="true"][data-state="open"]')) return;

  const html = document.documentElement;
  const body = document.body;

  // Remove locks comuns deixados por libs de dialog/drawer
  html.classList.remove("overflow-hidden");
  body.classList.remove("overflow-hidden");

  // Flags usadas por alguns scroll-locks
  html.removeAttribute("data-scroll-locked");
  body.removeAttribute("data-scroll-locked");

  // Limpar estilos inline de position fixed que travam o scroll
  if (body.style.position === "fixed") {
    body.style.position = "";
    body.style.top = "";
    body.style.width = "";
    body.style.left = "";
    body.style.right = "";
  }
}

export function useEnsureScrollable() {
  const location = useLocation();

  useEffect(() => {
    unlockDocumentScroll();
    const t1 = window.setTimeout(unlockDocumentScroll, 50);
    const t2 = window.setTimeout(unlockDocumentScroll, 300);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.pathname, location.key]);

  useEffect(() => {
    let scheduled = false;
    const scheduleUnlock = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        unlockDocumentScroll();
      });
    };

    const html = document.documentElement;
    const body = document.body;
    const observer = new MutationObserver(() => scheduleUnlock());

    observer.observe(html, { attributes: true, attributeFilter: ["class", "style", "data-scroll-locked"] });
    observer.observe(body, { attributes: true, attributeFilter: ["class", "style", "data-scroll-locked"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") unlockDocumentScroll();
    };
    const onPageShow = () => unlockDocumentScroll();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
}
