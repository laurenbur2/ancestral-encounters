// Ancestral Encounters — small site interactions
document.documentElement.classList.add("js");

// Scroll-reveal: fade + rise elements as they enter the viewport
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (e) { e.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (e) { io.observe(e); });
})();

// Current year in footer
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// Home page: solidify the transparent header once the user scrolls past the top
(function () {
  if (!document.body.classList.contains("home")) return;
  var header = document.querySelector(".site-header");
  if (!header) return;
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// Slide-in sidebar drawer (three-bar toggle, backdrop, esc, scroll lock)
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  var backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  function setOpen(open) {
    toggle.classList.toggle("open", open);
    links.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  toggle.addEventListener("click", function () {
    setOpen(!links.classList.contains("open"));
  });
  backdrop.addEventListener("click", function () { setOpen(false); });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setOpen(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();

// Contact form — front-end only for now.
// To receive messages, connect a free service like Formspree:
//   1. Sign up at https://formspree.io
//   2. Set the form's action to your Formspree URL and method="POST"
//   3. Remove the preventDefault handler below.
(function () {
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      status.textContent = "Please fill in your name, email, and message.";
      status.style.color = "#b5613a";
      return;
    }
    status.textContent =
      "Thank you for reaching out. (This demo form isn't connected yet — see js/main.js to link it to email.)";
    status.style.color = "#2f4a3c";
    form.reset();
  });
})();
