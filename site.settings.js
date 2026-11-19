window.SiteSettings = {
  business: {
    name: "Example Service Business",
    shortName: "Example Business",
    phone: "(555) 123-4567",
    email: "hello@example.com",
    address: "123 Main Street, Suite 100, Your City, ST 00000",
    websiteUrl: "https://example.com/"
  },

  legal: {
    termsEffectiveDate: "2026-01-01",
    privacyEffectiveDate: "2026-01-01"
  },

  socials: {
    facebook: "",
    youtube: "",
    instagram: "",
    x: "",
    linkedin: ""
  },

  ctas: {
    primary: {
      label: "Request a Quote"
    }
  },

  tracking: {
    googleAnalyticsId: "",
    metaPixelId: ""
  },

  leadCapture: {
    embed: {
      placeholder: "Custom lead form embed goes here.",
      html: ""
    },

    native: {
      endpoint: "/api/lead",
      successMessage: "Thanks. We received your message and will follow up shortly.",
      errorMessage: "Sorry, something went wrong. Please try again or contact us directly.",
      sendLeadConfirmation: true,
      serviceOptions: [
        "Service One",
        "Service Two",
        "Service Three"
      ]
    }
  },

  media: {
    heroImages: {}
  },

  integrations: {
    reviews: {
      provider: "Reviews",
      placeholder: "Reviews widget embed goes here.",
      html: ""
    },

    chat: {
      provider: "Chat",
      placeholder: "Chat widget embed goes here.",
      html: ""
    },

    scheduler: {
      provider: "Scheduler",
      placeholder: "Schedule widget embed goes here.",
      html: ""
    },

    schedulerBooking: {
      provider: "Scheduler",
      placeholder: "Booking widget embed goes here.",
      html: ""
    },

    map: {
      provider: "Map",
      placeholder: "Google Maps iframe embed goes here.",
      autoFromAddress: true,
      html: ""
    }
  }
};
