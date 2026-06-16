// Ancestral Encounters — small site interactions

// Current year in footer
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
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
