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
      "service-one-hero": "/_components/sections/services/service-one/hero.html",
      "service-one-intro": "/_components/sections/services/service-one/intro.html",
      "service-one-benefits": "/_components/sections/services/service-one/benefits.html",
      "service-two-hero": "/_components/sections/services/service-two/hero.html",
      "service-two-intro": "/_components/sections/services/service-two/intro.html",
      "service-two-benefits": "/_components/sections/services/service-two/benefits.html",
      "service-three-hero": "/_components/sections/services/service-three/hero.html",
      "service-three-intro": "/_components/sections/services/service-three/intro.html",
      "service-three-benefits": "/_components/sections/services/service-three/benefits.html",
      "about-hero": "/_components/sections/about/hero.html",
      "about-intro": "/_components/sections/about/intro.html",
      "about-story": "/_components/sections/about/story.html",
      "about-bio": "/_components/sections/about/bio.html",
      "location-contact": "/_components/sections/location-contact.html"
    }
  },

  pages: {
    home: {
      title: "Generic SMB Website Template",
      seo: {
        focusKeyword: "local service business",
        secondaryKeywords: [
          "small business services",
          "local service provider",
          "book a consultation",
          "request a quote"
        ],
        metaTitle: "Local Service Business | Generic SMB Template",
        metaDescription: "A flexible website template for local service businesses with service pages, lead capture, reviews, contact details, and booking embeds.",
        canonicalPath: "/"
      },
      header: "main",
      sections: ["home-hero", "trust-strip", "home-intro", "home-services", "home-business-showcase", "home-benefits", "home-bio", "home-why-us", "reviews", "location-contact", "faq", "final-cta"],
      footer: "main"
    },

    "service-one": {
      title: "Service One | Generic SMB Template",
      seo: {
        focusKeyword: "primary service",
        secondaryKeywords: [
          "service one",
          "local service",
          "request a quote",
          "service provider"
        ],
        metaTitle: "Service One | Generic SMB Template",
        metaDescription: "A generic service detail page template for the primary service offered by a local business.",
        canonicalPath: "/services/service-one/"
      },
      header: "main",
      sections: ["service-one-hero", "service-one-intro", "service-one-benefits", "location-contact"],
      footer: "main"
    },

    "service-two": {
      title: "Service Two | Generic SMB Template",
      seo: {
        focusKeyword: "secondary service",
        secondaryKeywords: [
          "service two",
          "service package",
          "local business service",
          "book a consultation"
        ],
        metaTitle: "Service Two | Generic SMB Template",
        metaDescription: "A generic service detail page template for a secondary service, package, or recurring offer.",
        canonicalPath: "/services/service-two/"
      },
      header: "main",
      sections: ["service-two-hero", "service-two-intro", "service-two-benefits", "location-contact"],
      footer: "main"
    },

    "service-three": {
      title: "Service Three | Generic SMB Template",
      seo: {
        focusKeyword: "specialty service",
        secondaryKeywords: [
          "service three",
          "specialty service",
          "premium service",
          "local service expert"
        ],
        metaTitle: "Service Three | Generic SMB Template",
        metaDescription: "A generic service detail page template for a specialty, premium, or differentiating service.",
        canonicalPath: "/services/service-three/"
      },
      header: "main",
      sections: ["service-three-hero", "service-three-intro", "service-three-benefits", "location-contact"],
      footer: "main"
    },

    about: {
      title: "About | Generic SMB Template",
      seo: {
        focusKeyword: "about local service business",
        secondaryKeywords: [
          "business story",
          "service team",
          "company values",
          "local business"
        ],
        metaTitle: "About | Generic SMB Template",
        metaDescription: "Introduce the business, team, values, and customer experience behind a local service provider.",
        canonicalPath: "/about/"
      },
      header: "main",
      sections: ["about-hero", "about-intro", "about-story", "about-bio", "location-contact"],
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
