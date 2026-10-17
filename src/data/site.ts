export const siteConfig = {
  name: "DevOps4Solutions",
  siteUrl: "https://devops4solutions.com",
  defaultTitle: "DevOps4Solutions | Enterprise AWS & DevOps Architecture",
  defaultDescription:
    "Enterprise AWS, DevOps, infrastructure automation, migration, and platform engineering guidance by Nidhi Gupta.",
  author: "Nidhi Gupta",
  email: "devops4solutions@gmail.com",
  youtubeUrl: "https://www.youtube.com/@DevOps4solutions/",
  linkedinUrl: "https://www.linkedin.com/in/nidhi-gupta-6a289575/",
  instagramUrl: "https://www.instagram.com/devops4solutions/",
  defaultSocialImage: "/images/social/og-default.svg",
  navigation: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services.html" },
    { label: "Case Studies", href: "/case-studies.html" },
    { label: "Blog", href: "/blog.html" },
    { label: "Videos", href: "/videos.html" },
    { label: "About", href: "/about.html" },
    { label: "Contact", href: "/contact.html" },
  ],
  footer: {
    services: [
      { label: "AWS Architecture", href: "/services.html" },
      { label: "Cloud Migration", href: "/services.html" },
      { label: "Terraform & IaC", href: "/services.html" },
      { label: "Kubernetes & EKS", href: "/services.html" },
    ],
    content: [
      { label: "Blog", href: "/blog.html" },
      { label: "Case Studies", href: "/case-studies.html" },
      { label: "Videos", href: "/videos.html" },
      { label: "GitHub Repository", href: "https://github.com/devops4solutions?tab=repositories" },
    ],
  },
} as const;
