// Ancestral Encounters — cart page
// Renders the items saved in the cart, lets the visitor change quantities,
// shows a subtotal, and checks out. Checkout uses PayPal once a Client ID
// is set in js/products.js; until then it falls back to "Request these
// pieces" (a message to us with the order summary).
(function () {
  var shop = window.AE_SHOP;
  var cart = window.AE_CART;
  var root = document.getElementById("cart-root");
  if (!shop || !cart || !root) return;

  var configured = shop.PAYPAL_CLIENT_ID && shop.PAYPAL_CLIENT_ID.indexOf("PASTE_") === -1;
  var sdkRequested = false;
  var state = { subtotal: 0, summary: "" };

  function lines() {
    var c = cart.getCart();
    var out = [];
    for (var id in c) {
      if (!c.hasOwnProperty(id)) continue;
      var p = shop.find(id);
      if (!p) continue; // product no longer exists
      out.push({ product: p, qty: c[id] });
    }
    return out;
  }

  function render() {
    var items = lines();

    if (!items.length) {
      root.innerHTML =
        '<div class="cart-empty">' +
        "<p>Your cart is empty.</p>" +
        '<a class="btn" href="shop.html">Browse the shop</a>' +
        "</div>";
      return;
    }

    var subtotal = 0;
    var hasRequest = false;
    var summaryParts = [];
    var rows = items.map(function (it) {
      var p = it.product;
      var priced = (p.price || 0) > 0;
      if (priced) subtotal += p.price * it.qty;
      else hasRequest = true;
      summaryParts.push(p.name + " x" + it.qty);
      var unit = priced ? shop.formatPrice(p.price) + " each" : "Price on request";
      var lineText = priced ? shop.formatPrice(p.price * it.qty) : "Price on request";
      var media = p.image
        ? '<img src="' + p.image + '" alt="' + p.name + '" />'
        : '<span class="cart-item-noimg">No photo</span>';
      return (
        '<div class="cart-item" data-id="' + p.id + '">' +
          '<a class="cart-item-media" href="product.html?id=' + p.id + '">' + media + "</a>" +
          '<div class="cart-item-info">' +
            '<a class="cart-item-name" href="product.html?id=' + p.id + '"><h3>' + p.name + "</h3></a>" +
            '<p class="cart-item-meta">' + p.meta + "</p>" +
            '<p class="cart-item-unit">' + unit + "</p>" +
            '<button class="cart-remove" data-act="remove" type="button">Remove</button>' +
          "</div>" +
          '<div class="cart-item-qty" role="group" aria-label="Quantity">' +
            '<button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button>' +
            '<span class="cart-qty-val">' + it.qty + "</span>" +
            '<button type="button" data-act="inc" aria-label="Increase quantity">+</button>' +
          "</div>" +
          '<div class="cart-item-line">' + lineText + "</div>" +
        "</div>"
      );
    }).join("");

    state.subtotal = subtotal;
    state.hasRequest = hasRequest;
    state.summary = summaryParts.join(", ");

    var subtotalLabel = hasRequest && subtotal === 0 ? "Price on request" : shop.formatPrice(subtotal);
    var requestNote = hasRequest
      ? '<p class="cart-summary-note">Some pieces are priced on request &mdash; we will confirm pricing before any payment.</p>'
      : "";

    root.innerHTML =
      '<div class="cart-list">' + rows + "</div>" +
      '<div class="cart-summary">' +
        '<div class="cart-subtotal"><span>Subtotal</span><strong>' + subtotalLabel + "</strong></div>" +
        requestNote +
        '<p class="cart-summary-note">Shipping and any taxes are arranged with you directly after your order.</p>' +
        '<div class="cart-checkout" id="cart-checkout"></div>' +
      "</div>";

    bindRowEvents();
    mountCheckout();
  }

  function bindRowEvents() {
    var rows = root.querySelectorAll(".cart-item");
    Array.prototype.forEach.call(rows, function (row) {
      var id = row.getAttribute("data-id");
      row.querySelectorAll("[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var act = btn.getAttribute("data-act");
          var current = cart.getCart()[id] || 0;
          if (act === "inc") cart.setQty(id, current + 1);
          else if (act === "dec") cart.setQty(id, current - 1);
          else if (act === "remove") cart.remove(id);
          render();
        });
      });
    });
  }

  function mountCheckout() {
    var box = document.getElementById("cart-checkout");
    if (!box) return;

    // Use the message-us flow when checkout isn't connected yet, or when the
    // order contains a price-on-request item we can't auto-charge.
    if (!configured || state.hasRequest) {
      var href = shop.CONTACT_URL + "?order=" + encodeURIComponent(state.summary);
      var msg = state.hasRequest
        ? "Send us your order and we will confirm pricing, secure payment, and delivery with care."
        : "Send us your order and we will arrange secure payment and delivery with care.";
      var lead = configured ? "" : "<strong>Secure checkout is being set up.</strong> ";
      box.innerHTML =
        '<p class="cart-note">' + lead + msg + "</p>" +
        '<a class="btn" href="' + href + '">Request these pieces</a>';
      return;
    }

    if (window.paypal) { renderPaypal(box); return; }
    if (!sdkRequested) {
      sdkRequested = true;
      var s = document.createElement("script");
      s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(shop.PAYPAL_CLIENT_ID) +
              "&currency=" + encodeURIComponent(shop.PAYPAL_CURRENCY) + "&components=buttons";
      s.onload = function () { var b = document.getElementById("cart-checkout"); if (b) renderPaypal(b); };
      s.onerror = function () { var b = document.getElementById("cart-checkout"); if (b) b.innerHTML = '<a class="btn" href="' + shop.CONTACT_URL + '">Request these pieces</a>'; };
      document.head.appendChild(s);
    }
  }

  function renderPaypal(box) {
    box.innerHTML = "";
    paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "pill", label: "pay" },
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [{
            description: "Ancestral Encounters order",
            amount: { value: state.subtotal.toFixed(2), currency_code: shop.PAYPAL_CURRENCY }
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          var name = (details.payer && details.payer.name && details.payer.name.given_name) || "friend";
          cart.clear();
          root.innerHTML =
            '<div class="cart-empty"><p class="product-paid">Thank you, ' + name +
            ". Your order is received. We will be in touch about delivery.</p>" +
            '<a class="btn" href="shop.html">Back to shop</a></div>';
        });
      }
    }).render(box);
  }

  render();
})();
