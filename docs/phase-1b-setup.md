# Phase 1b (consulting + contact): manual setup

The consulting page is built but **switched off**: `/consulting.html` exists, but while `features.consulting` is `false` it's `noindex`, not linked from the navigation, and kept out of the sitemap and site search. Preview it locally at http://localhost:4321/consulting.html.

## 1. Review the content

Edit `src/data/sessions.yaml`: titles, summaries, "includes", "best for" and button labels. The four sessions are drafts. Check every line reflects what you actually offer. Change `order` to reorder the cards.

The FAQ and "How it works" text are in `src/pages/consulting.astro` (`faqs` and `steps`).

## 2. Set up Cal.com

1. Create an account at https://cal.com (the free plan works) and set your availability and time zone.
2. Create one **event type** per session, for example `intro-30` (30 min), `deep-dive-60` (60 min), `mentoring-60` (60 min). Under each event's **Advanced** settings, add any questions you want answered on booking (company, topic, links).
3. **Take payment at booking (optional):** **Apps → Stripe → Install**, connect your Stripe account, then in each paid event type open **Apps → Stripe**, enable it and set the price and currency.
4. Copy each event's link. For `https://cal.com/devops4solutions/deep-dive-60` the `calLink` is `devops4solutions/deep-dive-60`.

## 3. Fill in `src/data/sessions.yaml`

```yaml
- id: deep-dive-60
  order: 2
  calLink: devops4solutions/deep-dive-60      # opens the Cal.com booking pop-up
  price: { amount: 150, currency: USD }       # shown on the card; keep it equal to the Cal.com/Stripe price
```

- **Without `calLink`:** the Book button goes to the contact page with the session pre-filled, and the visitor emails you to book.
- **Without `price`:** the card shows "Price on request".
- **Monthly advisory:** use `calLink` for a recurring call, or `bookingUrl` with a Stripe subscription Payment Link (Stripe Dashboard → Payment Links → recurring price).

## 4. Switch it on

In `src/config/site.ts` set:

```ts
consulting: true,
```

This:
- adds **Consulting** to the header and footer
- points **Book a call** to `/consulting.html`
- points the contact page's "Book a consultation" card to it
- makes the page indexable, adds it to the sitemap and site search, and outputs its `Service` structured data

Then run `npm run build && npm run check:urls` and deploy.

## 5. Analytics events added

| Event | Properties | When |
|---|---|---|
| `Book session` | `page`, `location` (session id) | Any session's Book button |
| `Booking completed` | `session` | Cal.com reports a successful booking in the pop-up |
| `Contact consultation` / `Contact project` / `Contact general` | `page` | Contact page option clicked |

With Plausible, add these as custom-event goals.

## 6. Contact page

`/contact.html` now offers three routes:
- **Book a consultation:** goes to the consulting page when it's switched on, otherwise to email.
- **Start a project:** an email with a pre-filled template (project type, budget, timeline, description). When `features.hireMe` is switched on, this links to `/hire-me.html` instead.
- **General questions:** email.

The email address comes from `siteConfig.email` in `src/config/site.ts`. Change it there once your domain mailbox exists.

---

# Project requests (/hire-me), payments (/pay) and security headers

`/hire-me.html` is **on** (`features.hireMe: true`) and runs in **email mode** until you add a Web3Forms key: after validation, submitting opens the visitor's email app with every field filled in. Adding the key switches it to online submission with the thank-you page, with no other change. `/pay.html` is built but **switched off** (`features.pay`). Preview it at http://localhost:4321/pay.html.

## 7. Form service: why Web3Forms

| (free tier, checked Nov 2026) | Formspree | Tally | **Web3Forms** |
|---|---|---|---|
| Submissions | 50 / month | Unlimited (fair use) | **250 / month** |
| Forms | Unlimited | Unlimited | Unlimited |
| File uploads | Paid plans only | **Free (10 MB per file)** | Pro only (5 MB default uploader) |
| Spam protection | Formshield filtering, reCAPTCHA; custom honeypot is Business-only | Built in | Server-side spam check, honeypot, **free hCaptcha** (no keys needed) |
| Email notifications | Yes | Yes (to you) | Yes |
| Works with your own HTML form | Yes (POST or AJAX) | **No: Tally-built forms only, embedded as iframe/popup** | Yes (POST or AJAX) |
| Custom redirect / thank-you page | Paid | Yes | Yes |

**Recommendation: Web3Forms.** It has the highest free submission limit among the services that accept your own form markup, plus a free honeypot and hCaptcha. The site keeps its own design, validation and `/hire-me/thanks.html` page.

**File uploads:** no service offers free uploads *and* your own markup.
- Tally does upload for free, but only through its own embedded form (an iframe), which means its styling, its validation and no control over the thank-you flow.
- So on the free plan the form asks for a **link to files** (Google Drive, Dropbox, OneDrive or GitHub) instead.
- If you upgrade to Web3Forms Pro, set `hireMe.attachments: true` in `src/config/site.ts` and the field becomes a real file upload (one file up to 5 MB, PDF/image/Word/ZIP), with no other change.

### Set up Web3Forms
1. Go to https://web3forms.com, enter the email address that should receive requests, and confirm it. You'll get an **access key**.
2. In `src/config/site.ts` set `hireMe.web3formsAccessKey: "<your key>"`. The key is designed to be public: it can only send email to the address you registered.
3. Optional, recommended once spam appears:
   - in the Web3Forms dashboard, enable **hCaptcha**
   - set `hireMe.hcaptcha: true`
4. `features.hireMe` is already on, so "Hire me for a project" is in the header and footer, and the contact page's "Start a project" card and the consulting page's project button link to it. With the key in place the form submits online; without it the build prints a reminder and the form stays in email mode.
5. Run `npm run build && npm run check:urls`, deploy, and send yourself a test request.

**How spam is handled:**
- Web3Forms' server-side filter checks every submission.
- A hidden `botcheck` honeypot catches basic bots.
- hCaptcha is optional.

**Privacy:** requests are processed by Web3Forms. Mention it in the privacy policy (roadmap 1b.3).

**Form fields in the email:** Project type (joined into one line), Budget, Timeline, Cloud platform, message, name, email (Reply-To), Files link or attachment, NDA requested (Yes/No).

## 8. Stripe invoices (deposits and milestones)

1. Create or log in to a Stripe account and complete business verification.
2. **Settings → Business → Customer emails:** enable emails for invoices and successful payments.
3. **Settings → Billing → Invoices:** add your logo, business details and default payment terms. Enable the payment methods you want (cards, bank transfer, etc.).
4. For each deposit or milestone: **Invoices → Create invoice** → add the customer's email (use the same email they used on the form), the line items and the due date → **Send invoice**. Stripe emails a hosted payment link and sends receipts automatically.

## 9. Fixed-price Stripe Payment Links (optional)

1. **Stripe → Payment Links → New**, choose or create a product with a fixed price, and optionally set a confirmation message or redirect.
2. Copy the link (`https://buy.stripe.com/...`).
3. In `src/config/site.ts` → `payments.stripe`, paste it as the `url` of an item and set `price` (display text, e.g. `"$500"`). Items with an empty `url` are hidden.
4. Turn the page on: `features.pay: true`. This adds "Pay an invoice" to the footer and a "Payment options" link on /hire-me.

## 10. Razorpay Payment Links (optional, for UPI/INR)

1. Razorpay Dashboard → **Payment Links** (or Payment Pages) → create a fixed-amount link and copy its URL.
2. Add it to `payments.razorpay` in `src/config/site.ts` and set `features.razorpay: true`. The buttons appear next to the Stripe ones on /pay.

No payment code or card data is on this site. Every payment button is a plain link to the provider's own checkout page.

## 11. Security headers and CSP

- **CSP:** each page carries a Content-Security-Policy `<meta>` tag generated by Astro, with hashes for every inline script.
  - It allows exactly: Cal.com, Stripe (checkout and future Buy Buttons), Web3Forms and hCaptcha, Giscus, YouTube, and the analytics provider set in `.env`.
  - When you add a new third-party service, add its domain to the `csp` lists in `astro.config.mjs`.
- **CloudFront:** apply `infra/cloudfront/security-headers-policy.json` (HSTS, nosniff, frame protection) and `infra/cloudfront/giscus-theme-cors-policy.json`. The steps are in `docs/cloudfront-phase0.md` §3.
- **Build warning:** `npm run build` prints a warning that Shiki uses inline styles. That's expected: `style-src` includes `'unsafe-inline'` for exactly this reason. Scripts stay strict, with hashes.

## 12. More analytics events

| Event | Properties | When |
|---|---|---|
| `Project request sent` | `types`, `budget` | Form submitted successfully |
| `Payment link` | `page`, `location` (provider: item) | A Payment Link button clicked |
