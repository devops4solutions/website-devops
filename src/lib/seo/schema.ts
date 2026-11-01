import { siteConfig } from "../../config/site";

// schema.org JSON-LD builders. Entities share stable @id values so search engines can link them.

const SITE = siteConfig.siteUrl;
export const PERSON_ID = `${SITE}/#person`;
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

const sameAs = Object.values(siteConfig.social).map((profile) => profile.url);

const serviceTypes = [
  "AWS Cloud Architecture",
  "Terraform & Infrastructure as Code",
  "Kubernetes & Amazon EKS",
  "CI/CD Automation",
  "Enterprise Cloud Migration",
  "Observability & Patch Operations",
];

/** Homepage graph: the person, the consulting business and the website. */
export const siteGraph = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: siteConfig.author.name,
      jobTitle: siteConfig.author.jobTitle,
      url: `${SITE}/about.html`,
      sameAs,
      knowsAbout: ["AWS", "Terraform", "Kubernetes", "Amazon EKS", "CI/CD", "Platform Engineering", "Cloud Migration"],
      worksFor: { "@id": ORG_ID },
    },
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": ORG_ID,
      name: siteConfig.name,
      url: `${SITE}/`,
      description: siteConfig.defaultDescription,
      email: siteConfig.email,
      founder: { "@id": PERSON_ID },
      sameAs,
      areaServed: "Worldwide",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "DevOps & AWS consulting services",
        itemListElement: serviceTypes.map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, provider: { "@id": ORG_ID } },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: siteConfig.name,
      url: `${SITE}/`,
      publisher: { "@id": ORG_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE}/search.html?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
});

interface ArticleInput {
  type: "BlogPosting" | "Article";
  url: string;
  title: string;
  description: string;
  image: string;
  published: Date;
  modified?: Date;
  keywords?: string[];
  section?: string;
}

export const articleSchema = ({ type, url, title, description, image, published, modified, keywords, section }: ArticleInput) => ({
  "@context": "https://schema.org",
  "@type": type,
  headline: title,
  description,
  image: new URL(image, SITE).toString(),
  datePublished: published.toISOString(),
  dateModified: (modified ?? published).toISOString(),
  // Named inline (not just @id) because the full Person/Organization entities live on the homepage.
  author: { "@type": "Person", "@id": PERSON_ID, name: siteConfig.author.name, url: `${SITE}/about.html` },
  publisher: { "@type": "Organization", "@id": ORG_ID, name: siteConfig.name, url: `${SITE}/` },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
  isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, name: siteConfig.name, url: `${SITE}/` },
  ...(keywords?.length ? { keywords: keywords.join(", ") } : {}),
  ...(section ? { articleSection: section } : {}),
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
});
