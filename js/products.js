// Ancestral Encounters — shop product catalog (single source of truth)
// ============================================================
//  EDIT YOUR PRODUCTS HERE.
//  Both the Shop grid (shop.html) and each item's own page
//  (product.html) are built automatically from this list.
//
//  For each product:
//    id          a short unique slug, lowercase-with-dashes. This is what
//                appears in the link (product.html?id=...). Don't reuse one.
//    name        the product title.
//    meta        the small label above the title (e.g. "Comcaac · Adornment").
//    price       a number. Use 0 to show "Price on request".
//    image       path to a photo in the images/ folder, or null for a
//                "Photo coming soon" placeholder.
//    blurb       one or two sentences shown on the shop grid card.
//    details     an array of paragraphs shown on the item's own page.
//
//  To add a product, copy a { ... } block and change the fields.
//  PayPal setup lives at the top of js/product.js.
// ============================================================
window.AE_SHOP = {
  PAYPAL_CLIENT_ID: "PASTE_YOUR_PAYPAL_CLIENT_ID_HERE",
  PAYPAL_CURRENCY: "USD",
  CONTACT_URL: "contact.html",

  products: [
    {
      id: "hand-woven-basket",
      name: "Hand-Woven Basket",
      meta: "Comcaac · Woven by hand",
      // When a product has "sizes", a Small/Medium/Large dropdown appears and
      // the price follows the chosen size. (These are sample prices — edit
      // the numbers, labels, or remove "sizes" entirely to go back to one price.)
      sizes: [
        { label: "Small", price: 120 },
        { label: "Medium", price: 180 },
        { label: "Large", price: 240 }
      ],
      price: 0,
      image: "images/comcaac-basket.jpg",
      blurb: "A traditional Comcaac coil basket, woven from desert torote and dyed with natural pigments.",
      details: [
        "A traditional Comcaac coil basket, woven from desert torote and dyed with natural pigments.",
        "Each basket is one of a kind and takes weeks of patient work by a single weaver. No two are exactly alike.",
        "Your purchase goes directly to the Comcaac artisans who keep this tradition alive."
      ]
    },
    {
      id: "bufo-otac-pipe",
      name: "Bufo (Otac) Pipe",
      meta: "Ceremonial · Hand-crafted",
      price: 0,
      image: "images/ceremonial-tools.jpg",
      blurb: "A ceremonial pipe crafted for working with Otac, made and blessed in the traditional way.",
      details: [
        "A ceremonial pipe crafted for working with Otac, made and blessed in the traditional way.",
        "A sacred tool for those who serve the medicine, made by hand and finished with care.",
        "Each piece is unique. Reach out if you would like to know more about a specific pipe before ordering."
      ]
    },
    {
      id: "shell-bead-necklace",
      name: "Shell & Bead Necklace",
      meta: "Comcaac · Adornment",
      price: 20,
      image: null,
      blurb: "A ceremonial necklace of Sea of Cortez shell and hand-strung beads, made by Comcaac artisans.",
      details: [
        "A ceremonial necklace of Sea of Cortez shell and hand-strung beads, made by Comcaac artisans.",
        "Worn in dance and ceremony, each necklace is strung by hand and one of a kind.",
        "Your purchase supports the makers and their families."
      ]
    }
  ],

  // --- helpers (no need to edit) ---------------------------------
  find: function (id) {
    for (var i = 0; i < this.products.length; i++) {
      if (this.products[i].id === id) return this.products[i];
    }
    return null;
  },
  formatPrice: function (price) {
    if (!price || price <= 0) return "Price on request";
    try {
      return price.toLocaleString("en-US", { style: "currency", currency: this.PAYPAL_CURRENCY });
    } catch (e) {
      return "$" + price.toFixed(2);
    }
  },
  // Lowest price across sizes, for "From $X" labels on the shop grid.
  startingPrice: function (p) {
    if (p.sizes && p.sizes.length) {
      var min = p.sizes[0].price;
      for (var i = 1; i < p.sizes.length; i++) { if (p.sizes[i].price < min) min = p.sizes[i].price; }
      return min;
    }
    return p.price || 0;
  },
  priceLabel: function (p) {
    if (p.sizes && p.sizes.length) return "From " + this.formatPrice(this.startingPrice(p));
    return this.formatPrice(p.price);
  }
};
