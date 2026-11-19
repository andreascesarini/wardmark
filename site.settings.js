window.SiteSettings = {
  business: {
    name: "Wardmark",
    shortName: "Wardmark",
    phone: "(555) 123-4567",
    email: "hello@example.com",
    address: "123 Main Street, Suite 100, Your City, ST 00000",
    websiteUrl: ""
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
      label: "Join the waiting list"
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
      submitLabel: "Join the waiting list",
      successMessage: "Thank you. You’re on the waiting list.",
      errorMessage: "Sorry, something went wrong. Please try again or contact us directly.",
      sendLeadConfirmation: true
    }
  },

  media: {
    heroImages: {
      home: {
        src: "/_assets/media/images/wardmark-hero.png",
        alt: "",
        position: "center",
        loading: "eager",
        fetchPriority: "high"
      },
      "active-directory-entra-id-security": {
        src: "/_assets/media/images/service-ad-entra.png",
        alt: "",
        loading: "eager",
        fetchPriority: "high"
      },
      "identity-architecture-migration": {
        src: "/_assets/media/images/service-identity-migration.png",
        alt: "",
        loading: "eager",
        fetchPriority: "high"
      },
      "access-governance": {
        src: "/_assets/media/images/service-access-governance.png",
        alt: "",
        loading: "eager",
        fetchPriority: "high"
      },
      "ai-agent-identity-readiness": {
        src: "/_assets/media/images/service-ai-agent.png",
        alt: "",
        loading: "eager",
        fetchPriority: "high"
      }
    }
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
