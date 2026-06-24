/* ============================================================================
 *  Ancestral Encounters — Stripe Checkout function (REFERENCE / NOT RUN BY THE SITE)
 * ============================================================================
 *  The shop is a static GitHub Pages site, so it cannot run Stripe by itself
 *  (your Stripe *secret* key must never live in the website's code). This tiny
 *  function is the one server-side piece. Deploy it for free, then paste its
 *  URL into js/products.js as STRIPE_CHECKOUT_URL. That's the only change
 *  needed to turn on real card checkout.
 *
 *  ---- HOW TO DEPLOY (Vercel, ~10 min) -------------------------------------
 *  1. Create a free account at https://vercel.com
 *  2. Make a new project/folder with:
 *       api/checkout.js        <- this file's contents
 *       package.json           <- { "dependencies": { "stripe": "^16" } }
 *  3. In the Vercel project Settings -> Environment Variables, add:
 *       STRIPE_SECRET_KEY = sk_live_...   (from https://dashboard.stripe.com/apikeys)
 *  4. Deploy. Your endpoint will be:  https://<your-project>.vercel.app/api/checkout
 *  5. Paste that URL into js/products.js -> STRIPE_CHECKOUT_URL and push.
 *
 *  (Netlify works too: put this in netlify/functions/checkout.js and export a
 *  handler; the logic is identical.)
 *
 *  Stripe collects the shipping address and (if you enable Stripe Tax in the
 *  dashboard) calculates tax at checkout. Update the two URLs and the allowed
 *  shipping countries below to match your shop.
 * ========================================================================== */

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SITE = "https://laurenbur2.github.io/ancestral-encounters";

module.exports = async (req, res) => {
  // Allow the GitHub Pages site to call this endpoint.
  res.setHeader("Access-Control-Allow-Origin", SITE);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const currency = (body.currency || "usd").toLowerCase();

    const line_items = (body.items || []).map((it) => ({
      quantity: it.quantity,
      price_data: {
        currency,
        unit_amount: it.amount, // cents, sent by the site
        product_data: { name: it.name },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      // Collect a shipping address. Adjust the country list to where you ship.
      shipping_address_collection: { allowed_countries: ["US", "CA", "MX"] },
      // Flat shipping fee (cents) sent by the site.
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: body.shipping_flat || 0, currency },
            display_name: "Standard shipping",
          },
        },
      ],
      // Tax: turn on Stripe Tax in the dashboard, then uncomment the next line
      // to have Stripe calculate exact tax at checkout automatically.
      // automatic_tax: { enabled: true },
      success_url: SITE + "/cart.html?paid=1",
      cancel_url: SITE + "/cart.html",
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
