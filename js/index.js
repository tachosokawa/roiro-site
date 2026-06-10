// ============================================================
// index.js — トップページ専用の処理
//   1. サイドナビのアクティブ表示
//   2. カルーセルのドラッグスクロール（PC）
//   3. カルーセルの自動送り（スマホ）
// ============================================================

// ── 1. サイドナビのアクティブ表示 ──
(function () {
  const sections     = document.querySelectorAll("section[id]");
  const sideNavLinks = document.querySelectorAll(".side-nav a[data-section]");
  if (!sideNavLinks.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        sideNavLinks.forEach((l) =>
          l.classList.toggle("active", l.dataset.section === e.target.id)
        );
      }
    });
  }, { threshold: 0.3 });
  sections.forEach((s) => io.observe(s));
})();

// ── 2. カルーセルをマウスでドラッグ・スクロール可能に（PC向け） ──
(function () {
  document.querySelectorAll(".how-cards, .event-cards, .together-cards").forEach((track) => {
    let isDown = false, startX = 0, startScroll = 0;
    track.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.classList.add("dragging");
    });
    window.addEventListener("mouseup", () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("dragging");
    });
    track.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      track.scrollLeft = startScroll - (e.pageX - startX);
    });
  });
})();

// ── 3. カルーセル自動送り：センター配置の無限ループ（スマホの横スクロール時のみ） ──
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const INTERVAL = 2800;   // 次のカードへ進む間隔(ms)
  const RESUME   = 5000;   // 手動操作後に再開するまで(ms)
  const mq = window.matchMedia("(max-width: 768px)");

  document.querySelectorAll(".how-cards, .event-cards, .together-cards").forEach((track) => {
    const originals = Array.from(track.children);
    const N = originals.length;
    let timer = null, io = null, paused = false, resumeTimer = null, clones = [], normTimer = null;

    const offsetOf = (el) =>
      el.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    // そのカードが中央に来るスクロール位置
    const centerTarget = (el) => offsetOf(el) - (track.clientWidth - el.offsetWidth) / 2;

    function markClone(cl) {
      cl.setAttribute("aria-hidden", "true");
      cl.querySelectorAll("a, button, [tabindex]").forEach((el) => el.setAttribute("tabindex", "-1"));
    }
    // 左右どちらにも隣のカードが覗くよう、前後に1セットずつ複製
    function addClones() {
      if (clones.length) return;
      for (let i = N - 1; i >= 0; i--) {
        const cl = originals[i].cloneNode(true); markClone(cl);
        track.insertBefore(cl, track.firstChild); clones.push(cl);
      }
      originals.forEach((c) => { const cl = c.cloneNode(true); markClone(cl); track.appendChild(cl); clones.push(cl); });
      // 初期表示：1枚目を中央に（左に最終カード・右に2枚目が少し覗く）
      track.scrollLeft = centerTarget(originals[0]);
    }
    function removeClones() {
      clones.forEach((c) => c.remove());
      clones = [];
      track.scrollLeft = 0;
    }

    // いま中央にあるカードの番号
    function centeredIndex() {
      const center = track.scrollLeft + track.clientWidth / 2;
      const kids = track.children;
      let idx = 0, best = Infinity;
      for (let i = 0; i < kids.length; i++) {
        const c = offsetOf(kids[i]) + kids[i].offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < best) { best = d; idx = i; }
      }
      return idx;
    }
    // 本体の範囲(N〜2N-1)から外れたら、同じ見た目のまま位置だけ戻す（継ぎ目なし）
    function normalize() {
      const P = offsetOf(track.children[N]) - offsetOf(track.children[0]); // 1セット分の距離
      const idx = centeredIndex();
      let delta = 0;
      if (idx >= 2 * N) delta = -P;
      else if (idx < N) delta = P;
      if (!delta) return;
      // iOS Safari は scroll-snap が有効だと瞬間移動をアニメーション付きの巻き戻しとして
      // 処理してしまう（4→1に戻って見える）。瞬間移動の間だけスナップを切る。
      const prevSnap = track.style.scrollSnapType;
      track.style.scrollSnapType = "none";
      track.scrollLeft += delta;   // 同じ見た目のまま位置だけ移動（継ぎ目なし）
      void track.offsetWidth;      // 位置の反映を強制してから
      track.style.scrollSnapType = prevSnap; // スナップを元に戻す
    }

    function advance() {
      if (paused || !clones.length) return;
      const idx = centeredIndex();
      const next = track.children[idx + 1] || track.children[idx];
      // 常に1枚分だけ前方向（右）へスムーズスクロール
      track.scrollTo({ left: centerTarget(next), behavior: "smooth" });
      // 送り終えてアイドルになった後に、必要なら瞬間移動で正規化する。
      // （スムーズスクロールと瞬間移動を同じ処理でまとめると iOS が
      //   開始位置を取り違えて左へ巻き戻すため、時間を分ける）
      clearTimeout(normTimer);
      normTimer = setTimeout(normalize, 800);
    }

    function start() { addClones(); if (!timer) timer = setInterval(advance, INTERVAL); }
    function stop()  { if (timer) { clearInterval(timer); timer = null; } clearTimeout(normTimer); }

    // 手動操作中は一時停止し、一定時間後に再開
    function pause() {
      paused = true;
      clearTimeout(resumeTimer);
      clearTimeout(normTimer);
      resumeTimer = setTimeout(() => { paused = false; }, RESUME);
    }
    ["pointerdown", "touchstart", "wheel"].forEach((ev) =>
      track.addEventListener(ev, pause, { passive: true })
    );

    function enable() {
      start();
      if ("IntersectionObserver" in window && !io) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0.2 });
        io.observe(track);
      }
    }
    function disable() {
      stop();
      if (io) { io.disconnect(); io = null; }
      removeClones();
    }

    function apply() { mq.matches ? enable() : disable(); }
    apply();
    mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
  });
})();
