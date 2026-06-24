// Ancestral Encounters — single product page
// ============================================================
//  PAYPAL SETUP lives in js/products.js (PAYPAL_CLIENT_ID).
//  Until a real Client ID is added, the buy button becomes a
//  "Message us to purchase" link so the page always works. Once
//  the Client ID is in place, live PayPal + card buttons appear.
// ============================================================
(function () {
  var shop = window.AE_SHOP;
  var root = document.getElementById("product-detail");
  if (!shop || !root) return;

  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var product = shop.find(getParam("id"));

  if (!product) {
    root.innerHTML =
      '<div class="product-missing">' +
      "<h1>Piece not found</h1>" +
      "<p>That item is no longer listed. Browse everything in the shop.</p>" +
      '<a class="btn" href="shop.html">Back to shop</a>' +
      "</div>";
    return;
  }

  document.title = product.name + " · Ancestral Encounters";

  var media = product.image
    ? '<div class="product-detail-media"><img src="' + product.image + '" alt="' + product.name + '" /></div>'
    : '<div class="product-detail-media placeholder">Photo coming soon</div>';

  var details = (product.details || [product.blurb || ""])
    .map(function (para) { return "<p>" + para + "</p>"; })
    .join("");

  root.innerHTML =
    '<div class="product-detail">' +
      media +
      '<div class="product-detail-info">' +
        '<p class="product-meta">' + product.meta + "</p>" +
        "<h1>" + product.name + "</h1>" +
        '<p class="product-detail-price">' + shop.formatPrice(product.price) + "</p>" +
        '<div class="product-detail-body">' + details + "</div>" +
        '<div class="product-buy" id="product-buy"></div>' +
        '<p class="product-note" id="product-note" hidden>Secure checkout is being set up. Message us and we will arrange payment and delivery with care.</p>' +
      "</div>" +
    "</div>";

  var slot = document.getElementById("product-buy");
  var note = document.getElementById("product-note");

  function inquireButton() {
    var a = document.createElement("a");
    a.className = "btn";
    a.href = shop.CONTACT_URL + "?item=" + encodeURIComponent(product.name);
    a.textContent = "Message us to purchase";
    return a;
  }

  function showFallback() {
    if (note) note.hidden = false;
    if (slot && !slot.children.length) slot.appendChild(inquireButton());
  }

  var configured = shop.PAYPAL_CLIENT_ID && shop.PAYPAL_CLIENT_ID.indexOf("PASTE_") === -1;
  var price = product.price || 0;

  // No price set yet, or PayPal not configured -> message-us fallback.
  if (!configured || price <= 0) { showFallback(); return; }

  var s = document.createElement("script");
  s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(shop.PAYPAL_CLIENT_ID) +
          "&currency=" + encodeURIComponent(shop.PAYPAL_CURRENCY) + "&components=buttons";
  s.onload = renderButtons;
  s.onerror = showFallback;
  document.head.appendChild(s);

  function renderButtons() {
    if (!window.paypal) { showFallback(); return; }
    paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "pill", label: "pay" },
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [{
            description: product.name,
            amount: { value: price.toFixed(2), currency_code: shop.PAYPAL_CURRENCY }
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          var name = (details.payer && details.payer.name && details.payer.name.given_name) || "friend";
          slot.innerHTML = '<p class="product-paid">Thank you, ' + name +
            ". Your order is received. We will be in touch about delivery.</p>";
        });
      },
      onError: function () { slot.innerHTML = ""; showFallback(); }
    }).render(slot);
  }
})();
