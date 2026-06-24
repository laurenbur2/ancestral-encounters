// Ancestral Encounters — shop grid
// Builds the product cards from js/products.js. Each card links to that
// item's own page (product.html?id=...) where it can be viewed and purchased.
(function () {
  var shop = window.AE_SHOP;
  var grid = document.getElementById("shop-grid");
  if (!shop || !grid) return;

  shop.products.forEach(function (p) {
    var card = document.createElement("a");
    card.className = "product card reveal is-visible";
    card.href = "product.html?id=" + encodeURIComponent(p.id);

    var media = p.image
      ? '<div class="product-media"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy" /></div>'
      : '<div class="product-media placeholder">Photo coming soon</div>';

    card.innerHTML =
      media +
      '<div class="product-body">' +
        '<p class="product-meta">' + p.meta + "</p>" +
        "<h3>" + p.name + "</h3>" +
        '<p class="product-blurb">' + p.blurb + "</p>" +
        '<p class="product-price">' + shop.formatPrice(p.price) + "</p>" +
        '<span class="btn btn-outline product-cta">See options</span>' +
      "</div>";

    grid.appendChild(card);
  });
})();
