// Ancestral Encounters — shop checkout (PayPal)
// ============================================================
//  ONE-TIME PAYPAL SETUP
//  1. Create a free PayPal *Business* account at https://www.paypal.com
//  2. Go to https://developer.paypal.com  ->  Apps & Credentials  ->
//     switch to "Live"  ->  create an app  ->  copy the *Client ID*.
//  3. Paste that Client ID below, replacing the placeholder text.
//  4. Set each product's real price in shop.html: the data-price="..."
//     attribute on every <article class="product">. Numbers only,
//     e.g. data-price="180.00".
//
//  Until a real Client ID is in place, every product shows a friendly
//  "Message us to purchase" button, so the shop always works. As soon
//  as the Client ID is added, live PayPal + card buttons appear
//  automatically. No other code changes needed.
// ============================================================
var PAYPAL_CLIENT_ID = "PASTE_YOUR_PAYPAL_CLIENT_ID_HERE";
var PAYPAL_CURRENCY  = "USD";
var SHOP_CONTACT_URL = "contact.html";

(function () {
  var products = Array.prototype.slice.call(document.querySelectorAll(".product"));
  if (!products.length) return;

  var configured = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID.indexOf("PASTE_") === -1;

  function fmt(price) {
    try {
      return price.toLocaleString("en-US", { style: "currency", currency: PAYPAL_CURRENCY });
    } catch (e) {
      return "$" + price.toFixed(2);
    }
  }

  function priceOf(p) { return parseFloat(p.getAttribute("data-price")) || 0; }

  // Fill in each product's price label.
  products.forEach(function (p) {
    var price = priceOf(p);
    var disp = p.querySelector("[data-price-display]");
    if (disp) disp.textContent = price > 0 ? fmt(price) : "Price on request";
  });

  function inquireButton(p) {
    var name = p.getAttribute("data-name") || "this piece";
    var a = document.createElement("a");
    a.className = "btn btn-outline";
    a.href = SHOP_CONTACT_URL + "?item=" + encodeURIComponent(name);
    a.textContent = "Message us to purchase";
    return a;
  }

  function renderFallback() {
    var notice = document.getElementById("shop-notice");
    if (notice) notice.hidden = false;
    products.forEach(function (p) {
      var slot = p.querySelector(".product-buy");
      if (slot && !slot.children.length) slot.appendChild(inquireButton(p));
    });
  }

  if (!configured) { renderFallback(); return; }

  // Real Client ID present — load the PayPal SDK and render buttons.
  var s = document.createElement("script");
  s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(PAYPAL_CLIENT_ID) +
          "&currency=" + encodeURIComponent(PAYPAL_CURRENCY) + "&components=buttons";
  s.onload = renderButtons;
  s.onerror = renderFallback;
  document.head.appendChild(s);

  function renderButtons() {
    if (!window.paypal) { renderFallback(); return; }
    products.forEach(function (p) {
      var slot = p.querySelector(".product-buy");
      var price = priceOf(p);
      var name = p.getAttribute("data-name") || "Ancestral Encounters item";
      if (!slot) return;
      if (price <= 0) { slot.appendChild(inquireButton(p)); return; }

      paypal.Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "pay" },
        createOrder: function (data, actions) {
          return actions.order.create({
            purchase_units: [{
              description: name,
              amount: { value: price.toFixed(2), currency_code: PAYPAL_CURRENCY }
            }]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            var name = (details.payer && details.payer.name && details.payer.name.given_name) || "friend";
            slot.innerHTML = '<p class="product-paid">Thank you, ' + name +
              '. Your order is received — we will be in touch about delivery.</p>';
          });
        },
        onError: function () { slot.innerHTML = ""; slot.appendChild(inquireButton(p)); }
      }).render(slot);
    });
  }
})();
