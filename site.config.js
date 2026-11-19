window.SiteTemplate = {
  components: {
    headers: {
      main: "/_components/headers/main.html",
      minimal: "/_components/headers/minimal.html"
    },
    footers: {
      main: "/_components/footers/main.html",
      minimal: "/_components/footers/minimal.html"
    },
    widgets: {
      chat: {
        integration: "chat",
        pages: []
      }
    },
    sections: {
      "home-hero": "/_components/sections/home/hero.html",
      "home-intro": "/_components/sections/home/intro.html",
      "home-services": "/_components/sections/home/services.html",
      "home-benefits": "/_components/sections/home/benefits.html",
      "home-bio": "/_components/sections/home/bio.html",
      "home-business-showcase": "/_components/sections/home/business-showcase.html",
      "home-why-us": "/_components/sections/home/why-us.html",
      "trust-strip": "/_components/sections/trust-strip.html",
      reviews: "/_components/sections/reviews.html",
      schedule: "/_components/sections/schedule.html",
      "schedule-booking": "/_components/sections/schedule-booking.html",
      faq: "/_components/sections/faq.html",
      "final-cta": "/_components/sections/final-cta.html",
      "services-hero": "/_components/sections/services/overview/hero.html",
      "services-offers": "/_components/sections/services/overview/offers.html",
      "services-delivery": "/_components/sections/services/overview/delivery.html",
      "services-faq": "/_components/sections/services/overview/faq.html",
      "ad-entra-hero": "/_components/sections/services/active-directory-entra-id-security/hero.html",
      "ad-entra-intro": "/_components/sections/services/active-directory-entra-id-security/intro.html",
      "ad-entra-benefits": "/_components/sections/services/active-directory-entra-id-security/benefits.html",
      "ad-entra-faq": "/_components/sections/services/active-directory-entra-id-security/faq.html",
      "identity-architecture-hero": "/_components/sections/services/identity-architecture-migration/hero.html",
      "identity-architecture-intro": "/_components/sections/services/identity-architecture-migration/intro.html",
      "identity-architecture-benefits": "/_components/sections/services/identity-architecture-migration/benefits.html",
      "identity-architecture-faq": "/_components/sections/services/identity-architecture-migration/faq.html",
      "access-governance-hero": "/_components/sections/services/access-governance/hero.html",
      "access-governance-intro": "/_components/sections/services/access-governance/intro.html",
      "access-governance-benefits": "/_components/sections/services/access-governance/benefits.html",
      "access-governance-faq": "/_components/sections/services/access-governance/faq.html",
      "ai-agent-readiness-hero": "/_components/sections/services/ai-agent-identity-readiness/hero.html",
      "ai-agent-readiness-intro": "/_components/sections/services/ai-agent-identity-readiness/intro.html",
      "ai-agent-readiness-benefits": "/_components/sections/services/ai-agent-identity-readiness/benefits.html",
      "ai-agent-readiness-faq": "/_components/sections/services/ai-agent-identity-readiness/faq.html",
      "about-hero": "/_components/sections/about/hero.html",
      "about-intro": "/_components/sections/about/intro.html",
      "about-story": "/_components/sections/about/story.html",
      "about-bio": "/_components/sections/about/bio.html",
      "about-faq": "/_components/sections/about/faq.html",
      "contact-hero": "/_components/sections/contact/hero.html",
      "contact-faq": "/_components/sections/contact/faq.html",
      "contact-message": "/_components/sections/contact/message.html",
      "location-contact": "/_components/sections/location-contact.html"
    }
  },

  pages: {
    home: {
      title: "Identity Security in Sweden & Switzerland | Wardmark",
      seo: {
        focusKeyword: "Identity security",
        metaTitle: "Identity Security in Sweden & Switzerland | Wardmark",
        metaDescription: "Wardmark provides identity security for regulated organisations in Sweden and Switzerland, from Active Directory and Entra ID to AI agent access.",
        canonicalPath: "/"
      },
      header: "main",
      sections: ["home-hero", "home-intro", "home-services", "home-why-us", "home-benefits", "home-bio", "reviews", "faq", "final-cta"],
      footer: "main"
    },

    services: {
      title: "Identity Security Services | Wardmark",
      seo: {
        focusKeyword: "Identity security services",
        metaTitle: "Identity Security Services | Wardmark",
        metaDescription: "Identity security services for regulated organisations in Sweden and Switzerland, covering Active Directory, Entra ID, access governance and AI agents.",
        canonicalPath: "/services/"
      },
      header: "main",
      sections: ["services-hero", "services-offers", "services-delivery", "services-faq", "final-cta"],
      footer: "main"
    },

    "active-directory-entra-id-security": {
      title: "Active Directory and Entra ID Security | Wardmark",
      seo: {
        focusKeyword: "Active Directory and Entra ID security",
        metaTitle: "Active Directory and Entra ID Security | Wardmark",
        metaDescription: "Active Directory and Entra ID security for regulated organisations in Sweden and Switzerland. Review privileged access and plan hardening changes.",
        canonicalPath: "/services/active-directory-entra-id-security/"
      },
      header: "main",
      sections: ["ad-entra-hero", "ad-entra-intro", "ad-entra-benefits", "ad-entra-faq", "final-cta"],
      footer: "main"
    },

    "identity-architecture-migration": {
      title: "Identity Architecture and Migration | Wardmark",
      seo: {
        focusKeyword: "Identity architecture and migration",
        metaTitle: "Identity Architecture and Migration | Wardmark",
        metaDescription: "Identity architecture and migration for regulated organisations in Sweden and Switzerland. Plan directory consolidations and moves to Microsoft Entra ID.",
        canonicalPath: "/services/identity-architecture-migration/"
      },
      header: "main",
      sections: ["identity-architecture-hero", "identity-architecture-intro", "identity-architecture-benefits", "identity-architecture-faq", "final-cta"],
      footer: "main"
    },

    "access-governance": {
      title: "Access Governance for Regulated Organisations | Wardmark",
      seo: {
        focusKeyword: "Access governance",
        metaTitle: "Access Governance for Regulated Organisations | Wardmark",
        metaDescription: "Access governance for regulated organisations in Sweden and Switzerland. Define roles, assign ownership and keep a clear record of access decisions.",
        canonicalPath: "/services/access-governance/"
      },
      header: "main",
      sections: ["access-governance-hero", "access-governance-intro", "access-governance-benefits", "access-governance-faq", "final-cta"],
      footer: "main"
    },

    "ai-agent-identity-readiness": {
      title: "AI Agent Identity Readiness | Wardmark",
      seo: {
        focusKeyword: "AI agent identity readiness",
        metaTitle: "AI Agent Identity Readiness | Wardmark",
        metaDescription: "AI agent identity readiness for regulated organisations in Sweden and Switzerland. Define permissions, ownership and reviews before agents go live.",
        canonicalPath: "/services/ai-agent-identity-readiness/"
      },
      header: "main",
      sections: ["ai-agent-readiness-hero", "ai-agent-readiness-intro", "ai-agent-readiness-benefits", "ai-agent-readiness-faq", "final-cta"],
      footer: "main"
    },

    about: {
      title: "About Wardmark | Identity Security Specialist",
      seo: {
        focusKeyword: "Identity security specialist",
        metaTitle: "About Wardmark | Identity Security Specialist",
        metaDescription: "Meet Andreas Eriksson, the identity security specialist behind Wardmark, with 15+ years of experience across Sweden, Australia and Switzerland.",
        canonicalPath: "/about/"
      },
      header: "main",
      sections: ["about-hero", "about-intro", "about-story", "about-bio", "about-faq", "final-cta"],
      footer: "main"
    },

    contact: {
      title: "Contact Wardmark | Send a Message",
      seo: {
        focusKeyword: "Contact Wardmark",
        metaTitle: "Contact Wardmark | Send a Message",
        metaDescription: "Contact Andreas Eriksson at Wardmark about identity security services in Sweden and Switzerland. Send a message and receive a reply by email.",
        canonicalPath: "/contact/"
      },
      header: "main",
      sections: ["contact-hero", "contact-message", "contact-faq"],
      footer: "main"
    },

    schedule: {
      title: "Booking | Generic SMB Template",
      seo: {
        focusKeyword: "",
        metaTitle: "Booking | Generic SMB Template",
        metaDescription: "Complete a booking, consultation, or contact request.",
        robots: "noindex, nofollow",
        canonicalPath: "/schedule/"
      },
      header: "minimal",
      sections: ["schedule-booking"],
      footer: "minimal"
    },

    terms: {
      title: "Terms and Conditions | Generic SMB Template",
      seo: {
        focusKeyword: "",
        metaTitle: "Terms and Conditions | Generic SMB Template",
        metaDescription: "Review the terms and conditions for using this website and related services.",
        canonicalPath: "/legal/terms-and-conditions/"
      },
      header: "main",
      footer: "main"
    },

    privacy: {
      title: "Privacy Policy | Generic SMB Template",
      seo: {
        focusKeyword: "",
        metaTitle: "Privacy Policy | Generic SMB Template",
        metaDescription: "Review how personal information is collected, used, stored, and shared.",
        canonicalPath: "/legal/privacy-policy/"
      },
      header: "main",
      footer: "main"
    },

    "not-found": {
      title: "Page Not Found | Generic SMB Template",
      seo: {
        focusKeyword: "",
        metaTitle: "Page Not Found | Generic SMB Template",
        metaDescription: "The requested page could not be found.",
        robots: "noindex"
      },
      header: "main",
      footer: "main"
    }
  }
};
