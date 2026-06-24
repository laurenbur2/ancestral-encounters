// Ancestral Encounters — cart page
// Shows the cart items, quantities, shipping, estimated tax, and total,
// then checks out. Checkout uses Stripe once STRIPE_CHECKOUT_URL is set in
// js/products.js; until then it falls back to "Request these pieces"
// (a message to us with the order summary). Orders that contain a
// price-on-request item always use the request flow.
(function () {
  var shop = window.AE_SHOP;
  var cart = window.AE_CART;
  var root = document.getElementById("cart-root");
  if (!shop || !cart || !root) return;

  var stripeReady = !!(shop.STRIPE_CHECKOUT_URL && shop.STRIPE_CHECKOUT_URL.indexOf("http") === 0);
  var state = { subtotal: 0, hasRequest: false, summary: "" };

  function lines() {
    var c = cart.getCart();
    var out = [];
    for (var key in c) {
      if (!c.hasOwnProperty(key)) continue;
      // a cart key is "<product-id>" or "<product-id>::<size-label>"
      var parts = key.split("::");
      var p = shop.find(parts[0]);
      if (!p) continue; // product no longer exists
      var sizeLabel = parts.length > 1 ? parts[1] : null;
      var unit = p.price || 0;
      if (sizeLabel && p.sizes) {
        for (var i = 0; i < p.sizes.length; i++) {
          if (p.sizes[i].label === sizeLabel) { unit = p.sizes[i].price; break; }
        }
      }
      out.push({ key: key, product: p, size: sizeLabel, unit: unit, qty: c[key] });
    }
    return out;
  }

  function row(it) {
    var p = it.product;
    var priced = it.unit > 0;
    var displayName = p.name + (it.size ? " &middot; " + it.size : "");
    var unitText = priced ? shop.formatPrice(it.unit) + " each" : "Price on request";
    var lineText = priced ? shop.formatPrice(it.unit * it.qty) : "Price on request";
    var media = p.image
      ? '<img src="' + p.image + '" alt="' + p.name + '" />'
      : '<span class="cart-item-noimg">No photo</span>';
    return (
      '<div class="cart-item" data-id="' + it.key + '">' +
        '<a class="cart-item-media" href="product.html?id=' + p.id + '">' + media + "</a>" +
        '<div class="cart-item-info">' +
          '<a class="cart-item-name" href="product.html?id=' + p.id + '"><h3>' + displayName + "</h3></a>" +
          '<p class="cart-item-meta">' + p.meta + "</p>" +
          '<p class="cart-item-unit">' + unitText + "</p>" +
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
  }

  function summaryRow(label, value, cls) {
    return '<div class="cart-row' + (cls ? " " + cls : "") + '"><span>' + label + "</span><span>" + value + "</span></div>";
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
    var rowsHtml = items.map(function (it) {
      if (it.unit > 0) subtotal += it.unit * it.qty;
      else hasRequest = true;
      summaryParts.push(it.product.name + (it.size ? " (" + it.size + ")" : "") + " x" + it.qty);
      return row(it);
    }).join("");

    state.subtotal = subtotal;
    state.hasRequest = hasRequest;
    state.summary = summaryParts.join(", ");

    var totalsHtml;
    if (hasRequest) {
      totalsHtml =
        (subtotal > 0 ? summaryRow("Subtotal (priced items)", shop.formatPrice(subtotal)) : "") +
        '<p class="cart-summary-note">Some pieces are priced on request &mdash; we will confirm the full total, shipping, and tax before any payment.</p>';
    } else {
      var shipping = subtotal > 0 ? (shop.SHIPPING_FLAT || 0) : 0;
      var tax = subtotal * (shop.TAX_RATE || 0);
      var total = subtotal + shipping + tax;
      state.total = total;
      totalsHtml =
        summaryRow("Subtotal", shop.formatPrice(subtotal)) +
        summaryRow("Shipping", shipping > 0 ? shop.formatPrice(shipping) : "Free") +
        summaryRow("Estimated tax", shop.formatPrice(tax)) +
        summaryRow("Total", shop.formatPrice(total), "cart-total") +
        '<p class="cart-summary-note">Tax is estimated; final tax and shipping are confirmed at checkout.</p>';
    }

    root.innerHTML =
      '<div class="cart-list">' + rowsHtml + "</div>" +
      '<div class="cart-summary">' +
        '<div class="cart-totals">' + totalsHtml + "</div>" +
        '<div class="cart-checkout" id="cart-checkout"></div>' +
      "</div>";

    bindRowEvents();
    mountCheckout();
  }

  function bindRowEvents() {
    var rows = root.querySelectorAll(".cart-item");
    Array.prototype.forEach.call(rows, function (rowEl) {
      var id = rowEl.getAttribute("data-id");
      rowEl.querySelectorAll("[data-act]").forEach(function (btn) {
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
    var requestHref = shop.CONTACT_URL + "?order=" + encodeURIComponent(state.summary);

    // Price-on-request items can't be auto-charged — always request.
    if (state.hasRequest) {
      box.innerHTML = '<a class="btn" href="' + requestHref + '">Request these pieces</a>';
      return;
    }

    // Stripe not connected yet — keep the shop working via the request flow.
    if (!stripeReady) {
      box.innerHTML =
        '<p class="cart-note"><strong>Card checkout is being set up.</strong> ' +
        "Send us your order and we will arrange secure payment and delivery.</p>" +
        '<a class="btn" href="' + requestHref + '">Request these pieces</a>';
      return;
    }

    // Stripe connected — hand the cart to the checkout function.
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Check out";
    btn.addEventListener("click", function () { stripeCheckout(btn); });
    box.appendChild(btn);
    var secure = document.createElement("p");
    secure.className = "cart-note";
    secure.innerHTML = "Secure payment by Stripe. Cards and Apple Pay accepted.";
    box.appendChild(secure);
  }

  function stripeCheckout(btn) {
    var payload = {
      currency: (shop.CURRENCY || "USD").toLowerCase(),
      shipping_flat: Math.round((shop.SHIPPING_FLAT || 0) * 100),
      tax_rate: shop.TAX_RATE || 0,
      items: lines().map(function (it) {
        return {
          id: it.product.id,
          name: it.product.name + (it.size ? " - " + it.size : ""),
          amount: Math.round(it.unit * 100), // cents
          quantity: it.qty
        };
      })
    };
    btn.disabled = true;
    btn.textContent = "Redirecting…";
    fetch(shop.STRIPE_CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.url) { window.location.href = data.url; }
        else { throw new Error("No checkout URL returned"); }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Check out";
        var box = document.getElementById("cart-checkout");
        if (box && !box.querySelector(".cart-error")) {
          var err = document.createElement("p");
          err.className = "cart-note cart-error";
          err.textContent = "Sorry, checkout could not start. Please try again, or message us.";
          box.appendChild(err);
        }
      });
  }

  render();
})();
