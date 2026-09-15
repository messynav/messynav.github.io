/* MessyNav project page behaviour. No dependencies.
   Pill nav reveal and current-section tracking, scroll reveals,
   back-to-top, and the BibTeX copy button. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- pill nav: slides in once the hero is behind you ---- */
  var nav = document.getElementById("nav");
  var hero = document.querySelector(".hero");

  if (nav && hero) {
    var syncNav = function () {
      nav.classList.toggle("show", hero.getBoundingClientRect().bottom < 120);
    };
    window.addEventListener("scroll", syncNav, { passive: true });
    window.addEventListener("resize", syncNav);
    syncNav();
  }

  /* ---- highlight whichever section you are reading ---- */
  var links = [].slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var targets = links
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if (targets.length && "IntersectionObserver" in window) {
    // A band across the upper third: the section occupying it is the one
    // being read, which a plain "is visible" test gets wrong on tall cards.
    var here = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("current",
            a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-15% 0px -70% 0px" });
    targets.forEach(function (t) { here.observe(t); });
  }

  /* ---- reveal on scroll ---- */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        seen.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    reveals.forEach(function (el) { seen.observe(el); });
  }

  /* ---- back to top ---- */
  var toTop = document.querySelector(".to-top");

  if (toTop) {
    var syncTop = function () {
      toTop.classList.toggle("show", window.scrollY > 900);
    };
    window.addEventListener("scroll", syncTop, { passive: true });
    syncTop();
  }

  document.querySelectorAll("[data-scroll-top]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---- copy the BibTeX entry ---- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var src = document.querySelector(btn.getAttribute("data-copy"));
    if (!src || !navigator.clipboard) return;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(src.textContent).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1600);
      });
    });
  });
})();
