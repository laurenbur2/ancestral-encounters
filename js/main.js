// Ancestral Encounters — small site interactions
document.documentElement.classList.add("js");

// Welcome splash (home only, once per session) -> reveal hero
(function () {
  var pre = document.getElementById("preloader");
  if (!pre) return;
  var seen = false;
  try { seen = sessionStorage.getItem("ae-welcomed") === "1"; } catch (e) {}
  if (seen) {
    if (pre.parentNode) pre.parentNode.removeChild(pre);
    document.body.classList.add("intro-done");
    return;
  }
  try { sessionStorage.setItem("ae-welcomed", "1"); } catch (e) {}
  setTimeout(function () { document.body.classList.add("intro-done"); }, 3000);
  setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 3950);
})();

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

  // Move the drawer out of the header. The header uses backdrop-filter, which
  // traps position:fixed descendants in its containing block — so when the page
  // is scrolled the open drawer renders off-screen at the document top. As a
  // direct child of <body> it positions relative to the viewport instead.
  document.body.appendChild(links);

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

  // Collapsible sub-menu ("Teachings & Journeys") — toggle open on click/tap
  var groupTitle = links.querySelector(".nav-group-title");
  if (groupTitle) {
    groupTitle.addEventListener("click", function () {
      var open = groupTitle.parentNode.classList.toggle("open");
      groupTitle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();

// Contact form — posts to a Supabase Edge Function ("contact"), which stores
// the message and emails it to the team via Resend (see supabase/functions/
// contact/index.ts). The submitter's email is used as the reply-to, so
// replying in your inbox goes straight back to them.
//
// Both values below are safe to expose in client code: the URL is public, and
// the anon key is a publishable key gated by Row Level Security. The Resend
// secret key lives only inside the Edge Function, never here.
var AE_CONTACT = {
  // e.g. "https://abcdefgh.supabase.co"
  SUPABASE_URL: "https://brzogufvxeniikzkxlot.supabase.co",
  // Supabase anon / publishable key
  SUPABASE_ANON_KEY: "sb_publishable_SUyhp3xGCxUkzLUqr-mShA_m8ewuD-S",
};
(function () {
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (!form) return;

  // Pick EN/ES copy to match the site language toggle (stored by js/i18n.js).
  function isSpanish() {
    try {
      return localStorage.getItem("ae_lang") === "es";
    } catch (e) {
      return false;
    }
  }
  var COPY = {
    invalid: {
      en: "Please fill in your name, email, and message.",
      es: "Por favor completa tu nombre, correo y mensaje.",
    },
    sending: {
      en: "Sending your message...",
      es: "Enviando tu mensaje...",
    },
    success: {
      en: "Thank you for reaching out. Your message is on its way, and we'll reply soon.",
      es: "Gracias por escribirnos. Tu mensaje está en camino y te responderemos pronto.",
    },
    error: {
      en: "Something went wrong sending your message. Please try again, or email us directly.",
      es: "Algo salió mal al enviar tu mensaje. Inténtalo de nuevo o escríbenos directamente.",
    },
  };
  function t(key) {
    return COPY[key][isSpanish() ? "es" : "en"];
  }

  var ERROR_COLOR = "#b5613a";
  var SUCCESS_COLOR = "#2f4a3c";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      status.textContent = t("invalid");
      status.style.color = ERROR_COLOR;
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    status.textContent = t("sending");
    status.style.color = SUCCESS_COLOR;

    var data = Object.fromEntries(new FormData(form).entries());
    fetch(AE_CONTACT.SUPABASE_URL + "/functions/v1/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        apikey: AE_CONTACT.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + AE_CONTACT.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        var body = result.body || {};
        // The message is saved to the database the moment it reaches the
        // function, even before Resend email notifications are configured. So
        // treat "saved, email pending" as success too — the visitor always gets
        // a confirmation and no message is ever lost.
        var savedEmailPending = body.error === "Email not configured";
        if ((result.ok && body.success) || savedEmailPending) {
          status.textContent = t("success");
          status.style.color = SUCCESS_COLOR;
          form.reset();
        } else {
          status.textContent = t("error");
          status.style.color = ERROR_COLOR;
        }
      })
      .catch(function () {
        status.textContent = t("error");
        status.style.color = ERROR_COLOR;
      })
      .finally(function () {
        if (button) button.disabled = false;
      });
  });
})();
