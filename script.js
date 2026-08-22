(function () {
  "use strict";

  // ---- scroll reveal ----
  var reveals = document.querySelectorAll(".reveal");
  reveals.forEach(function (el) {
    var d = el.getAttribute("data-delay");
    if (d !== null) el.style.setProperty("--d", d);
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---- scroll progress bar ----
  var progress = document.getElementById("progress");
  function updateProgress() {
    var h = document.documentElement;
    var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    if (progress) progress.style.width = (scrolled * 100) + "%";
  }

  // ---- hero parallax ----
  var heroMedia = document.querySelector("[data-parallax]");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY;
      if (heroMedia && y < window.innerHeight) {
        heroMedia.style.transform = "translate3d(0," + y * 0.25 + "px,0)";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // ---- mobile nav ----
  var burger = document.getElementById("burger");
  var links = document.querySelector(".nav__links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- contact form (Netlify Forms, with graceful fallback) ----
  var form = document.querySelector(".form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button");
      var name = (form.querySelector('input[name="name"]') || {}).value || "";
      name = name.trim();
      var data = new FormData(form);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString()
      })
        .then(done)
        .catch(done);

      function done() {
        btn.textContent = "Thanks" + (name ? ", " + name : "") + " — we'll be in touch";
        btn.style.background = "var(--accent)";
        btn.style.color = "#0e0e0f";
        form.reset();
      }
    });
  }
})();
