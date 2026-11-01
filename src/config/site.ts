// Site-wide configuration: identity, contact details, social links, feature flags and navigation.
//
// Feature flags gate links to pages that do not exist yet. Turn a flag on in the same change that
// adds its page. If a flag is enabled without the page, `npm run check:urls` fails on the broken link.

export const features = {
  /** /learn.html hub: courses, guides, labs and paths (roadmap Phase 2). */
  learn: false,
  /** /consulting.html with session types and Cal.com booking (roadmap 1.3). */
  consulting: true,
  /** /hire-me.html project request form. Without `hireMe.web3formsAccessKey` it works in email mode. */
  hireMe: true,
  /** /pay.html: how invoices are paid, plus fixed-price Stripe Payment Links. */
  pay: false,
  /** Show Razorpay Payment Links (UPI) next to the Stripe ones on /pay.html. */
  razorpay: false,
  /** /legal/terms.html, /legal/refunds.html and /legal/cookies.html (roadmap 1.16). */
  legal: false,
} as const;

export type Feature = keyof typeof features;

export interface NavLink {
  label: string;
  href: string;
  /** Feature flag that must be on for the link to render. */
  requires?: Feature;
  external?: boolean;
}

export const siteConfig = {
  name: "DevOps4Solutions",
  siteUrl: "https://devops4solutions.com",
  tagline: "Enterprise AWS & DevOps Consulting",
  defaultTitle: "DevOps4Solutions | Enterprise AWS & DevOps Architecture",
  defaultDescription:
    "Enterprise AWS, DevOps, infrastructure automation, migration, and platform engineering guidance by Nidhi Gupta.",
  author: {
    name: "Nidhi Gupta",
    jobTitle: "Lead Platform DevOps Engineer",
  },
  email: "devops4solutions@gmail.com",
  social: {
    youtube: { label: "YouTube", handle: "@DevOps4solutions", url: "https://www.youtube.com/@DevOps4solutions/" },
    linkedin: { label: "LinkedIn", handle: "Nidhi Gupta", url: "https://www.linkedin.com/in/nidhi-gupta-6a289575/" },
    instagram: { label: "Instagram", handle: "@devops4solutions", url: "https://www.instagram.com/devops4solutions/" },
    github: { label: "GitHub", handle: "devops4solutions", url: "https://github.com/devops4solutions" },
  },
  defaultSocialImage: "/og/default.png",
  /** Source repository, used for "Edit on GitHub" links. */
  repo: {
    url: "https://github.com/devops4solutions/website-devops",
    branch: "main",
  },
  /** Blog index and tag pages show this many posts per page. */
  postsPerPage: 9,
  /** X (Twitter) handle for the twitter:site meta tag, e.g. "@devops4solutions". Leave empty if none. */
  xHandle: "",
  /**
   * Project request form on /hire-me.html, submitted directly to Web3Forms (no server code here).
   * The access key is public by design: it only lets this form send email to the address you
   * registered at web3forms.com. While empty, the form opens a pre-filled email instead of submitting online.
   */
  hireMe: {
    formEndpoint: "https://api.web3forms.com/submit",
    web3formsAccessKey: "",
    /** File upload input. Web3Forms attachments need a paid (Pro) plan; when false a "link to files" field is shown instead. */
    attachments: false,
    /** Web3Forms' free hCaptcha. Enable "hCaptcha" in the Web3Forms dashboard too. */
    hcaptcha: false,
    projectTypes: [
      "AWS migration",
      "Landing zone / multi-account setup",
      "Terraform / Infrastructure as Code",
      "Kubernetes / Amazon EKS",
      "CI/CD pipelines",
      "Observability & patch automation",
      "Cost optimisation",
      "Architecture review",
      "Other",
    ],
    budgets: ["Under $5k", "$5k – $15k", "$15k – $50k", "$50k+", "Not sure yet"],
    timelines: ["As soon as possible", "Within a month", "1 – 3 months", "3+ months", "Flexible"],
    platforms: ["AWS", "Azure", "Google Cloud", "Hybrid / on-premises", "Multi-cloud", "Not sure yet"],
  },
  /**
   * Fixed-price Payment Links shown on /pay.html. Create them in the Stripe / Razorpay dashboards
   * and paste the URLs here. Entries with an empty `url` are hidden. No card data touches this site.
   */
  payments: {
    stripe: [
      { label: "Architecture deep dive (60 min)", price: "", description: "Single paid session.", url: "" },
      { label: "Project deposit", price: "", description: "Deposit to book a project start date.", url: "" },
    ],
    /** Shown only when `features.razorpay` is on (UPI and Indian cards). */
    razorpay: [
      { label: "Architecture deep dive (60 min)", price: "", description: "Pay with UPI or Indian cards.", url: "" },
    ],
  },
  /** Cal.com embed. Change only if you self-host Cal.com. Event links live in src/data/sessions.yaml. */
  cal: {
    origin: "https://cal.com",
    embedScript: "https://app.cal.com/embed/embed.js",
  },
  comments: {
    /**
     * "custom" loads /giscus-theme.css (site colours) in production builds; it needs a CORS header on
     * that file, see docs/phase-1a-setup.md. "light" uses Giscus's built-in theme.
     */
    theme: "custom" as "custom" | "light",
  },
} as const;

/** Primary header navigation (desktop and mobile). */
export const headerNav: NavLink[] = [
  { label: "Blog", href: "/blog.html" },
  { label: "Learn", href: "/learn.html", requires: "learn" },
  { label: "Consulting", href: "/consulting.html", requires: "consulting" },
  { label: "Hire me for a project", href: "/hire-me.html", requires: "hireMe" },
  { label: "About", href: "/about.html" },
];

/** Header call to action. Falls back to the contact page until the consulting page exists. */
export const bookCallLink: NavLink = features.consulting
  ? { label: "Book a call", href: "/consulting.html" }
  : { label: "Book a call", href: "/contact.html" };

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Learn",
    links: [
      { label: "Learning hub", href: "/learn.html", requires: "learn" },
      { label: "Blog", href: "/blog.html" },
      { label: "Videos", href: "/videos.html" },
      { label: "GitHub repositories", href: "https://github.com/devops4solutions?tab=repositories", external: true },
    ],
  },
  {
    title: "Work with me",
    links: [
      { label: "Services", href: "/services.html" },
      { label: "Case studies", href: "/case-studies.html" },
      { label: "Consulting", href: "/consulting.html", requires: "consulting" },
      { label: "Hire me for a project", href: "/hire-me.html", requires: "hireMe" },
      { label: "Pay an invoice", href: "/pay.html", requires: "pay" },
      { label: "Contact", href: "/contact.html" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy.html" },
      { label: "Terms", href: "/legal/terms.html", requires: "legal" },
      { label: "Refunds", href: "/legal/refunds.html", requires: "legal" },
      { label: "Cookies", href: "/legal/cookies.html", requires: "legal" },
    ],
  },
];

/** Drops links whose feature flag is off. */
export const visibleLinks = (links: NavLink[]) => links.filter((link) => !link.requires || features[link.requires]);
