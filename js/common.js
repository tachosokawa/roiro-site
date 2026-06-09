// ============================================================
// common.js — 全ページ共通の処理
//   1. ハンバーガーメニューの開閉
//   2. スクロールリビール（画面に入ったら要素が登場）
// 各ページに存在する要素だけが対象になるため、
// このファイル1つで index / about / how-to-join すべてに対応します。
// ============================================================

// ── 1. ハンバーガーメニュー ──
(function () {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const closeBtn     = document.getElementById("close-btn");
  const spNav        = document.getElementById("sp-nav");
  const spLinks      = document.querySelectorAll(".sp-link");

  if (!spNav) return; // SPナビが無いページでは何もしない

  function openNav()  { spNav.classList.add("open");    document.body.style.overflow = "hidden"; }
  function closeNav() { spNav.classList.remove("open"); document.body.style.overflow = ""; }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", openNav);
  if (closeBtn)     closeBtn.addEventListener("click", closeNav);
  spLinks.forEach((l) => l.addEventListener("click", closeNav));
})();

// ── 2. スクロールリビール ──
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // 単体要素：[セレクタ, 動きの種類]（全ページ分をまとめて記載）
  const singles = [
    [".section-title", "up"],
    [".speech-bubble", "up"],
    [".contact-lead", "up"],
    [".community-illust", "up"],
    [".community-body", "up"],
    [".instagram-illust", "up"],
    [".btn-center", "up"],
    // index
    [".about-illust", "up"],
    [".about-grid > div:last-child", "up"],
    [".about-field-desc p", "up"],
    [".how-desc", "up"],
    [".access-map", "up"],
    [".access-info", "up"],
    // about
    [".about-hero-illust", "up"],
    [".about-intro", "up"],
    [".section-nothing h2", "up"],
    [".section-nothing p", "up"],
    [".founders-lead", "up"],
    // how-to-join
    [".htj-hero-illust", "up"],
    [".htj-lead", "up"],
    [".htj-desc", "up"],
    [".htj-btns", "up"],
  ];

  // カード群：子要素を1枚ずつスタガー表示
  const groups = [
    ".about-field-text h2",
    ".how-cards",
    ".event-cards",
    ".together-cards",
    ".info-cards",
    ".contact-cards",
    ".founders-cards",
    ".join-rows",
  ];
  // これらは時間差なし（カードを全部同時に表示）
  const noStagger = [".how-cards", ".event-cards"];
  const variantClass = { up: "", left: "reveal-left", right: "reveal-right", scale: "reveal-scale" };

  const revealIO = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  singles.forEach(([sel, type]) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add("reveal");
      if (variantClass[type]) el.classList.add(variantClass[type]);
      revealIO.observe(el);
    });
  });

  groups.forEach((sel) => {
    const stagger = noStagger.indexOf(sel) === -1;
    document.querySelectorAll(sel).forEach((group) => {
      group.classList.add("reveal-group");
      if (stagger) {
        Array.from(group.children).forEach((child, i) => {
          child.style.transitionDelay = (i * 0.12) + "s";
        });
      }
      revealIO.observe(group);
    });
  });
})();
