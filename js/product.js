// Ancestral Encounters — single product page
// Renders the item from js/products.js (by ?id=) and adds it to the cart.
// Items with a price show "Add to cart"; price-on-request items show
// "Message us to purchase" instead. Checkout happens on cart.html.
(function () {
  var shop = window.AE_SHOP;
  var cart = window.AE_CART;
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

  var hasSizes = !!(product.sizes && product.sizes.length);
  var initialPrice = hasSizes ? product.sizes[0].price : (product.price || 0);

  var sizeHtml = "";
  if (hasSizes) {
    var opts = product.sizes.map(function (s, i) {
      return '<option value="' + i + '">' + s.label + " &mdash; " + shop.formatPrice(s.price) + "</option>";
    }).join("");
    sizeHtml =
      '<div class="product-size">' +
        '<label for="size-select">Size</label>' +
        '<select id="size-select">' + opts + "</select>" +
      "</div>";
  }

  root.innerHTML =
    '<div class="product-detail">' +
      media +
      '<div class="product-detail-info">' +
        '<p class="product-meta">' + product.meta + "</p>" +
        "<h1>" + product.name + "</h1>" +
        '<p class="product-detail-price" id="product-price">' + shop.formatPrice(initialPrice) + "</p>" +
        '<div class="product-detail-body">' + details + "</div>" +
        sizeHtml +
        '<div class="product-buy" id="product-buy"></div>' +
        '<p class="product-status" id="product-status" aria-live="polite"></p>' +
      "</div>" +
    "</div>";

  var slot = document.getElementById("product-buy");
  var status = document.getElementById("product-status");
  var priceEl = document.getElementById("product-price");
  var sizeSel = document.getElementById("size-select");

  function selectedSize() {
    if (!hasSizes) return null;
    return product.sizes[parseInt(sizeSel.value, 10) || 0];
  }

  if (sizeSel) {
    sizeSel.addEventListener("change", function () {
      priceEl.textContent = shop.formatPrice(selectedSize().price);
    });
  }

  // Coming-soon mode: nothing is for sale yet, so show a disabled
  // "Coming soon" label instead of an add-to-cart button.
  if (shop.COMING_SOON) {
    var soon = document.createElement("span");
    soon.className = "btn btn-outline is-coming-soon product-cta-soon";
    soon.textContent = "Coming soon";
    slot.appendChild(soon);
    return;
  }

  // Every item can be added to the cart. Price-on-request items are added
  // too; at checkout the cart routes those to a "request these pieces"
  // message so we can confirm pricing before payment.
  var addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn";
  addBtn.textContent = "Add to cart";
  slot.appendChild(addBtn);

  addBtn.addEventListener("click", function () {
    var size = selectedSize();
    var key = size ? product.id + "::" + size.label : product.id;
    cart.add(key, 1);
    var n = cart.getCart()[key] || 1;
    var what = size ? product.name + " (" + size.label + ")" : product.name;
    status.innerHTML = "Added " + what + " to cart (" + n + ' in cart). <a href="cart.html">View cart &rarr;</a>';
  });
})();
