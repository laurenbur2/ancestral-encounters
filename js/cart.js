// Ancestral Encounters — shopping cart (browser-stored)
// Loaded on every page so the cart-count badge in the menu stays current.
// State lives in localStorage as { "<product-id>": <quantity>, ... }.
window.AE_CART = (function () {
  var KEY = "ae-cart";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function write(cart) {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    updateBadges();
  }

  function getCart() { return read(); }
  function count() {
    var c = read(), n = 0;
    for (var k in c) { if (c.hasOwnProperty(k)) n += c[k]; }
    return n;
  }
  function add(id, qty) {
    var c = read();
    c[id] = (c[id] || 0) + (qty || 1);
    write(c);
  }
  function setQty(id, qty) {
    var c = read();
    if (qty <= 0) { delete c[id]; } else { c[id] = qty; }
    write(c);
  }
  function remove(id) { var c = read(); delete c[id]; write(c); }
  function clear() { write({}); }

  function updateBadges() {
    var n = count();
    var badges = document.querySelectorAll("[data-cart-count]");
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = n;
      badges[i].classList.toggle("has-items", n > 0);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateBadges);
  } else {
    updateBadges();
  }
  // keep in sync across tabs
  window.addEventListener("storage", function (e) { if (e.key === KEY) updateBadges(); });

  return {
    getCart: getCart, count: count, add: add,
    setQty: setQty, remove: remove, clear: clear, updateBadges: updateBadges
  };
})();
