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
- **Start a project:** an email with a pre-filled template (project type, budget, timeline, description). When the project-request form is built (Phase 1c) and `projectRequest` is switched on, this links to the form instead.
- **General questions:** email.

The email address comes from `siteConfig.email` in `src/config/site.ts`. Change it there once your domain mailbox exists.
