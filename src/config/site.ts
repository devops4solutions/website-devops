// Site-wide configuration: identity, contact details, social links, feature flags and navigation.
//
// Feature flags gate links to pages that do not exist yet. Turn a flag on in the same change that
// adds its page. If a flag is enabled without the page, `npm run check:urls` fails on the broken link.

export const features = {
  /** /learn.html hub: courses, guides, labs and paths (roadmap Phase 2). */
  learn: false,
  /** /consulting.html with session types and Cal.com booking (roadmap 1.3). */
  consulting: false,
  /** /project-request.html form posting to /api/project-request (roadmap 1.5). */
  projectRequest: false,
  /** /pay.html with invoice and Payment Link instructions (roadmap 1.7). */
  pay: false,
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
} as const;

/** Primary header navigation (desktop and mobile). */
export const headerNav: NavLink[] = [
  { label: "Blog", href: "/blog.html" },
  { label: "Learn", href: "/learn.html", requires: "learn" },
  { label: "Consulting", href: "/consulting.html", requires: "consulting" },
  { label: "Hire me for a project", href: "/project-request.html", requires: "projectRequest" },
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
      { label: "Hire me for a project", href: "/project-request.html", requires: "projectRequest" },
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
