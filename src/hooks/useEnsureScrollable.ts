import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function unlockDocumentScroll() {
  // Se existir modal aberto (Radix coloca aria-modal="true"), não forçamos unlock
  // para não quebrar o comportamento esperado de dialogs/sheets.
  // IMPORTANT: só consideramos "aberto" se data-state="open".
  if (document.querySelector('[aria-modal="true"][data-state="open"]')) return;

  const html = document.documentElement;
  const body = document.body;

  // Remove locks comuns deixados por libs de dialog/drawer
  html.classList.remove("overflow-hidden");
  body.classList.remove("overflow-hidden");

  // Garantir rolagem vertical
  html.style.overflowY = "auto";
  body.style.overflowY = "auto";
  body.style.overflowX = "hidden";

  // Alguns locks usam position: fixed + top
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";

  // iOS/Android gesture
  body.style.touchAction = "pan-y";

  // Flags usadas por alguns scroll-locks
  html.removeAttribute("data-scroll-locked");
  body.removeAttribute("data-scroll-locked");
}

export function useEnsureScrollable() {
  const location = useLocation();

  useEffect(() => {
    // Rodar mais de uma vez porque alguns componentes aplicam scroll-lock no mesmo tick.
    unlockDocumentScroll();
    const t1 = window.setTimeout(unlockDocumentScroll, 0);
    const t2 = window.setTimeout(unlockDocumentScroll, 250);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.pathname, location.key]);

  useEffect(() => {
    // Alguns componentes podem re-aplicar scroll-lock depois do nosso unlock.
    // Observamos mudanças em html/body e removemos locks quando NÃO houver modal aberto.
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

    observer.observe(html, { attributes: true, attributeFilter: ["class", "style"] });
    observer.observe(body, { attributes: true, attributeFilter: ["class", "style"] });

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
