const site = window.SiteTemplate;
const settings = window.SiteSettings || {};
const ctas = settings.ctas || {};
const tracking = settings.tracking || {};
const leadCapture = settings.leadCapture || {};
const media = settings.media || {};
const integrations = settings.integrations || {};
const pageName = document.body.dataset.page || "home";
const page = site.pages[pageName];

let lastFocusedElement = null;

async function loadHtml(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.text();
}

async function renderSlot(slotId, path) {
  const slot = document.getElementById(slotId);
  slot.innerHTML = await loadHtml(path);
}

function getSectionPath(sectionName) {
  const path = site.components.sections[sectionName];

  if (!path) {
    throw new Error(`Unknown section: ${sectionName}`);
  }

  return path;
}

async function loadSectionHtml(sectionName) {
  return loadHtml(getSectionPath(sectionName));
}

async function renderSections(sectionNames, options = {}) {
  const main = document.getElementById("site-main");
  const shouldClear = options.clear !== false;

  if (shouldClear) {
    main.innerHTML = "";
  }

  if (!sectionNames.length) {
    return;
  }

  const html = await Promise.all(sectionNames.map(loadSectionHtml));
  main.insertAdjacentHTML("beforeend", html.join(""));
}

function activateInsertedScripts(container) {
  const scripts = container.querySelectorAll("script");

  scripts.forEach((oldScript) => {
    const newScript = document.createElement("script");

    for (const attribute of oldScript.attributes) {
      newScript.setAttribute(attribute.name, attribute.value);
    }

    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
}

function renderEmbedPlaceholder(message) {
  return `
    <div class="integration-placeholder">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function getSettingValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getWebsiteUrl() {
  return getSettingValue(settings.business?.websiteUrl).replace(/\/+$/, "");
}

function getSettingByPath(path) {
  return path.split(".").reduce((current, key) => {
    return current && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : "";
  }, settings);
}

function renderSettings() {
  const settingSlots = document.querySelectorAll("[data-setting]");

  settingSlots.forEach((slot) => {
    slot.textContent = getSettingByPath(slot.dataset.setting);
  });
}

function getSettingHref(value, type) {
  const settingValue = getSettingValue(value);

  if (!settingValue) {
    return "";
  }

  if (type === "tel") {
    return `tel:${settingValue.replace(/[^\d+]/g, "")}`;
  }

  if (type === "email") {
    return `mailto:${settingValue}`;
  }

  return settingValue;
}

function renderSettingHrefs() {
  const linkSlots = document.querySelectorAll("[data-setting-href]");

  linkSlots.forEach((slot) => {
    const value = getSettingByPath(slot.dataset.settingHref);
    const href = getSettingHref(value, slot.dataset.settingHrefType);

    if (!href) {
      slot.removeAttribute("href");
      return;
    }

    slot.href = href;
  });
}

function renderSocialLinks() {
  const socialLinks = document.querySelectorAll("[data-social]");

  socialLinks.forEach((link) => {
    const url = getSettingValue(settings.socials?.[link.dataset.social]);

    if (!url) {
      link.remove();
      return;
    }

    link.href = url;
  });

  document.querySelectorAll(".social-links").forEach((nav) => {
    if (!nav.querySelector("a")) {
      nav.remove();
    }
  });
}

function renderDynamicSettings() {
  renderSettings();
  renderSettingHrefs();
  renderSocialLinks();
}

function escapeCssUrl(value) {
  return String(value ?? "").replace(/["\\\n\r]/g, "\\$&");
}

function getImageSource(image) {
  return typeof image === "string" ? image : image?.src;
}

function getCurrentHeroImage() {
  return (media.heroImages || {})[pageName];
}

function preloadCurrentHeroImage() {
  const imageSrc = getImageSource(getCurrentHeroImage());

  if (!imageSrc) {
    return;
  }

  const alreadyPreloaded = Array.from(document.head.querySelectorAll('link[rel="preload"][as="image"]')).some((link) => {
    return link.href === new URL(imageSrc, window.location.href).href;
  });

  if (alreadyPreloaded) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = imageSrc;
  link.setAttribute("fetchpriority", "high");
  document.head.append(link);
}

function renderHeroImages() {
  const heroImages = media.heroImages || {};
  const heroSlots = document.querySelectorAll("[data-hero-image-slot]");

  heroSlots.forEach((hero) => {
    const image = heroImages[hero.dataset.heroImageSlot];
    const imageSrc = getImageSource(image);

    if (!imageSrc) {
      return;
    }

    hero.style.setProperty("--hero-image", `url("${escapeCssUrl(imageSrc)}")`);
    hero.classList.add("hero-with-image");

    if (image?.position) {
      hero.style.setProperty("--hero-image-position", image.position);
    }

    if (image?.overlay) {
      hero.style.setProperty("--hero-overlay", image.overlay);
    }

    let imageElement = hero.querySelector(".hero-background-image");

    if (!imageElement) {
      const viewport = document.createElement("div");
      viewport.className = "hero-artwork-viewport";
      viewport.setAttribute("aria-hidden", "true");
      const layer = document.createElement("div");
      layer.className = "hero-artwork-layer";
      imageElement = document.createElement("img");
      imageElement.className = "hero-background-image";
      layer.append(imageElement);
      viewport.append(layer);
      hero.prepend(viewport);

      // Preserve the existing image composition in a viewport-fixed frame.
      // Only layout changes need measurements; scrolling is handled by CSS.
      const positionArtwork = () => {
        const bounds = hero.getBoundingClientRect();
        hero.style.setProperty("--hero-document-top", `${bounds.top + window.scrollY}px`);
        hero.style.setProperty("--hero-document-left", `${bounds.left + window.scrollX}px`);
        hero.style.setProperty("--hero-frame-width", `${bounds.width}px`);
        hero.style.setProperty("--hero-frame-height", `${bounds.height}px`);
        hero.classList.add("hero-fixed-artwork");
      };
      const observer = new ResizeObserver(positionArtwork);
      observer.observe(hero);
      const header = document.getElementById("site-header");
      if (header) observer.observe(header);
      positionArtwork();
    }

    imageElement.src = imageSrc;
    imageElement.alt = typeof image === "string" ? "" : image.alt || "";
    imageElement.decoding = "async";
    imageElement.loading = image.loading || "lazy";

    if (image.fetchPriority) {
      imageElement.fetchPriority = image.fetchPriority;
    }
  });
}

function loadScript(src) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function renderGoogleAnalytics(measurementId) {
  if (!measurementId) {
    return;
  }

  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

function renderMetaPixel(pixelId) {
  if (!pixelId) {
    return;
  }

  if (!window.fbq) {
    const fbq = function fbq() {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
        return;
      }

      fbq.queue.push(arguments);
    };

    window.fbq = fbq;
    window._fbq = window._fbq || fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    loadScript("https://connect.facebook.net/en_US/fbevents.js");
  }

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

function renderTracking() {
  renderGoogleAnalytics(getSettingValue(tracking.googleAnalyticsId));
  renderMetaPixel(getSettingValue(tracking.metaPixelId));
}

function upsertMeta(name, content) {
  if (!content) {
    return;
  }

  let tag = document.head.querySelector(`meta[name="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.append(tag);
  }

  tag.content = content;
}

function upsertCanonical(path) {
  if (!path) {
    return;
  }

  let tag = document.head.querySelector('link[rel="canonical"]');

  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.append(tag);
  }

  const websiteUrl = getWebsiteUrl();
  tag.href = websiteUrl ? `${websiteUrl}${path}` : path;
}

function renderSeo() {
  const seo = page.seo || {};

  document.title = seo.metaTitle || page.title;
  upsertMeta("description", seo.metaDescription);
  upsertMeta("robots", seo.robots);
  upsertCanonical(seo.canonicalPath);
}

function getNativeLeadCaptureSettings() {
  return leadCapture.native || {};
}

function renderNativeLeadForm() {
  const native = getNativeLeadCaptureSettings();
  const endpoint = getSettingValue(native.endpoint) || "/api/lead";
  const confirmation = native.sendLeadConfirmation === false ? "false" : "true";
  const businessName = escapeHtml(settings.business?.name || "Wardmark");

  return `
    <form class="lead-capture-form" action="${escapeHtml(endpoint)}" method="post" aria-label="Join the waiting list" data-native-lead-form>
      <input type="hidden" name="sendLeadConfirmation" value="${confirmation}">
      <input type="hidden" name="businessName" value="${escapeHtml(settings.business?.name || "")}">

      <label class="form-field lead-form-honeypot" aria-hidden="true">
        Company
        <input type="text" name="company" tabindex="-1" autocomplete="off">
      </label>

      <label class="form-field">
        Full name
        <input type="text" name="name" autocomplete="name" maxlength="120" required>
      </label>

      <label class="form-field">
        Work email
        <input type="email" name="email" autocomplete="email" maxlength="180" required>
      </label>

      <label class="form-field">
        Mobile number (optional)
        <input type="tel" name="phone" autocomplete="tel" maxlength="32">
        <span class="form-help">Include the country code, for example +46.</span>
      </label>

      <label class="form-field">
        Organisation
        <input type="text" name="organisation" autocomplete="organization" maxlength="180" required>
      </label>

      <label class="form-field">
        Tell us a little about your business
        <textarea name="message" rows="5" maxlength="3000" required></textarea>
      </label>

      <fieldset class="marketing-preferences">
        <legend>Keep in touch (optional)</legend>
        <label class="form-consent">
          <input type="checkbox" name="emailMarketingConsent" value="true">
          <span>I agree to receive marketing emails from ${businessName} about identity security services, availability and offers. I can unsubscribe at any time using the link in each email.</span>
        </label>
      </fieldset>

      <p class="form-legal"><a href="/legal/privacy-policy/" target="_blank" rel="noopener">Privacy Policy</a> &middot; <a href="/legal/terms-and-conditions/" target="_blank" rel="noopener">Terms &amp; Conditions</a></p>
      <button class="button" type="submit" data-native-lead-submit>${escapeHtml(native.submitLabel || "Send Inquiry")}</button>
      <p class="lead-form-status" data-native-lead-status role="status" aria-live="polite" hidden></p>
    </form>
  `;
}

function getLeadCaptureHtml() {
  const embedHtml = leadCapture.embed?.html || "";

  if (getSettingValue(embedHtml)) {
    return embedHtml;
  }

  return renderNativeLeadForm();
}

function renderLeadCaptureSlots() {
  document.querySelectorAll("[data-lead-capture-slot]").forEach((slot) => {
    slot.innerHTML = getLeadCaptureHtml();
    activateInsertedScripts(slot);
  });
}

function renderLeadCaptureModal() {
  const modalRoot = document.createElement("div");
  modalRoot.id = "site-modals";
  document.body.append(modalRoot);

  modalRoot.innerHTML = `
    <div class="lead-modal" id="lead-modal" hidden>
      <div class="lead-modal-backdrop" data-lead-capture-close></div>
      <div class="lead-modal-panel" role="dialog" aria-modal="true" aria-label="Join the waiting list">
        <button class="lead-modal-close" type="button" data-lead-capture-close aria-label="Close lead form">x</button>
        <div class="lead-capture-placeholder"></div>
      </div>
    </div>

    <div class="schedule-modal" id="schedule-modal" hidden>
      <div class="lead-modal-backdrop" data-schedule-modal-close></div>
      <div class="lead-modal-panel schedule-modal-panel" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <button class="lead-modal-close" type="button" data-schedule-modal-close aria-label="Close schedule">x</button>
        <p class="section-eyebrow">Schedule</p>
        <h2 id="schedule-modal-title">Choose a time that <span class="text-accent">fits your week.</span></h2>
        <div class="calendar-placeholder" data-schedule-integration="scheduler"></div>
        <p class="schedule-subtext">Use this area for a booking calendar, consultation scheduler, or intake flow.</p>
      </div>
    </div>
  `;

  const leadCaptureSlot = modalRoot.querySelector(".lead-capture-placeholder");
  leadCaptureSlot.innerHTML = getLeadCaptureHtml();
  activateInsertedScripts(leadCaptureSlot);
}

function getNativeLeadSuccessMessage() {
  const native = getNativeLeadCaptureSettings();
  return native.successMessage || "Thank you. You’re on the waiting list.";
}

function getNativeLeadErrorMessage() {
  const native = getNativeLeadCaptureSettings();
  return native.errorMessage || "Sorry, something went wrong. Please try again or contact us directly.";
}

function setNativeFormStatus(form, message, type, selector) {
  const status = form.querySelector(selector);

  if (!status) {
    return;
  }

  status.textContent = message;
  status.hidden = false;
  status.dataset.status = type;
}

function validateLeadPhone(form) {
  const phone = form.elements.namedItem("phone");
  const number = phone.value.trim().replace(/[ ().-]/g, "");
  let error = "";

  if (number && !/^\+[1-9]\d{6,14}$/.test(number)) {
    error = "Enter a valid mobile number with its country code, starting with +.";
  }

  phone.setCustomValidity(error);
}

async function submitNativeLeadForm(form) {
  return submitNativeForm(form, {
    submitSelector: "[data-native-lead-submit]",
    statusSelector: "[data-native-lead-status]",
    successMessage: getNativeLeadSuccessMessage(),
    errorMessage: getNativeLeadErrorMessage(),
    validate: validateLeadPhone
  });
}

async function submitNativeContactForm(form) {
  return submitNativeForm(form, {
    submitSelector: "[data-native-contact-submit]",
    statusSelector: "[data-native-contact-status]",
    successMessage: "Thank you. Your message has been sent.",
    errorMessage: "Sorry, your message could not be sent. Please try again."
  });
}

async function submitNativeForm(form, options) {
  const submitButton = form.querySelector(options.submitSelector);
  const originalLabel = submitButton?.textContent;

  options.validate?.(form);
  if (submitButton?.disabled || !form.reportValidity()) {
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  setNativeFormStatus(form, "", "pending", options.statusSelector);

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok !== true) {
      throw new Error(data.message || options.errorMessage);
    }

    form.reset();
    options.validate?.(form);
    setNativeFormStatus(form, options.successMessage, "success", options.statusSelector);
  } catch (error) {
    setNativeFormStatus(form, error.message || options.errorMessage, "error", options.statusSelector);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  }
}

function bindNativeLeadForms() {
  const validatePhone = (event) => {
    const form = event.target.closest("[data-native-lead-form]");
    if (form && event.target.name === "phone") {
      validateLeadPhone(form);
    }
  };
  document.addEventListener("input", validatePhone);
  document.addEventListener("change", validatePhone);

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-native-lead-form], [data-native-contact-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    if (form.hasAttribute("data-native-contact-form")) {
      submitNativeContactForm(form);
    } else {
      submitNativeLeadForm(form);
    }
  });
}

async function renderWidgets() {
  const widgets = site.components.widgets || {};
  const widgetEntries = Object.entries(widgets).filter(([, widget]) => {
    return widget.pages?.includes(pageName);
  });

  if (!widgetEntries.length) {
    return;
  }

  const widgetRoot = document.createElement("div");
  widgetRoot.id = "site-widgets";
  document.body.append(widgetRoot);

  for (const [widgetName, widget] of widgetEntries) {
    const integrationName = widget.integration;

    if (!integrationName) {
      throw new Error(`Unknown widget integration: ${widgetName}`);
    }

    widgetRoot.insertAdjacentHTML("beforeend", getIntegrationHtml(integrationName));
  }

  activateInsertedScripts(widgetRoot);
}

function getIntegrationHtml(integrationName) {
  const integration = integrations[integrationName];

  if (!integration) {
    throw new Error(`Unknown integration: ${integrationName}`);
  }

  const html = integration.html || "";

  if (getSettingValue(html)) {
    return html;
  }

  if (integrationName === "map") {
    const mapHtml = getAddressMapEmbedHtml(integration);

    if (mapHtml) {
      return mapHtml;
    }
  }

  const provider = integration.provider || "Integration";
  const placeholder = integration.placeholder || `${provider} widget embed goes here.`;

  return renderEmbedPlaceholder(placeholder);
}

function getAddressMapEmbedHtml(integration) {
  if (integration.autoFromAddress === false) {
    return "";
  }

  const address = getSettingValue(settings.business?.address);

  if (!address) {
    return "";
  }

  const query = encodeURIComponent(address);
  const title = `Map location for ${getSettingValue(settings.business?.name) || "business address"}`;

  return `
    <iframe
      title="${escapeHtml(title)}"
      src="https://www.google.com/maps?q=${query}&output=embed"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      allowfullscreen>
    </iframe>
  `;
}

function renderIntegrationSlot(slot, integrationName) {
  slot.innerHTML = getIntegrationHtml(integrationName);
  activateInsertedScripts(slot);
}

function renderIntegrations() {
  const integrationSlots = document.querySelectorAll("[data-integration]");

  integrationSlots.forEach((slot) => {
    renderIntegrationSlot(slot, slot.dataset.integration);
  });
}

function renderScheduleModalIntegration() {
  const slot = document.querySelector("#schedule-modal [data-schedule-integration]");

  if (!slot || slot.dataset.integrationRendered === "true") {
    return;
  }

  renderIntegrationSlot(slot, slot.dataset.scheduleIntegration);
  slot.dataset.integrationRendered = "true";
}

function renderCtas() {
  const ctaSlots = document.querySelectorAll("[data-cta]");

  ctaSlots.forEach((slot) => {
    const ctaName = slot.dataset.cta;
    const cta = ctas[ctaName];

    if (!cta) {
      throw new Error(`Unknown CTA: ${ctaName}`);
    }

    const button = slot.matches("button, a") ? slot : document.createElement("button");
    button.classList.add("button");

    if (button.tagName === "BUTTON") {
      button.type = "button";
    }

    button.textContent = cta.label;

    if (ctaName === "primary") {
      button.dataset.leadCapture = "";
    }

    if (button !== slot) {
      slot.replaceWith(button);
    }
  });
}

function openLeadCapture() {
  const inlineSlot = document.querySelector("[data-lead-capture-slot]");

  if (inlineSlot) {
    inlineSlot.scrollIntoView({ block: "center" });
    inlineSlot.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, button')?.focus({ preventScroll: true });
    return;
  }

  const modal = document.getElementById("lead-modal");

  if (!modal) {
    return;
  }

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  const closeButton = modal.querySelector("[data-lead-capture-close]");
  closeButton?.focus();
}

function closeLeadCapture() {
  const modal = document.getElementById("lead-modal");

  if (!modal || modal.hidden) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("modal-open");
  lastFocusedElement?.focus();
}

function openScheduleModal() {
  const modal = document.getElementById("schedule-modal");

  if (!modal) {
    return;
  }

  renderScheduleModalIntegration();
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  const closeButton = modal.querySelector("[data-schedule-modal-close]");
  closeButton?.focus();
}

function closeScheduleModal() {
  const modal = document.getElementById("schedule-modal");

  if (!modal || modal.hidden) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("modal-open");
  lastFocusedElement?.focus();
}

function bindLeadCapture() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-lead-capture]")) {
      event.preventDefault();
      openLeadCapture();
      return;
    }

    if (event.target.closest("[data-lead-capture-close]")) {
      closeLeadCapture();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLeadCapture();
    }
  });
}

function bindScheduleModal() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-schedule-modal]")) {
      event.preventDefault();
      openScheduleModal();
      return;
    }

    if (event.target.closest("[data-schedule-modal-close]")) {
      closeScheduleModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeScheduleModal();
    }
  });
}

function bindMobileNav() {
  const nav = document.querySelector(".nav");
  const toggle = nav?.querySelector(".nav-toggle");
  const links = nav?.querySelector(".nav-links");

  if (!nav || !toggle || !links) {
    return;
  }

  const dropdown = nav.querySelector(".nav-dropdown");
  const hoverNavigation = window.matchMedia("(min-width: 901px) and (hover: hover) and (pointer: fine)");
  let dropdownCloseTimer;
  let openedByHover = false;
  const closeDropdown = () => {
    window.clearTimeout(dropdownCloseTimer);
    openedByHover = false;
    if (dropdown) dropdown.open = false;
  };

  dropdown?.addEventListener("pointerenter", (event) => {
    if (!hoverNavigation.matches || event.pointerType === "touch") return;
    window.clearTimeout(dropdownCloseTimer);
    if (!dropdown.open) {
      openedByHover = true;
      dropdown.open = true;
    }
  });

  dropdown?.addEventListener("pointerleave", (event) => {
    if (!hoverNavigation.matches || event.pointerType === "touch") return;
    dropdownCloseTimer = window.setTimeout(() => {
      if (!dropdown.matches(":hover") && !dropdown.contains(document.activeElement)) {
        closeDropdown();
      }
    }, 180);
  });

  dropdown?.querySelector("summary").addEventListener("click", (event) => {
    // A pointer click following hover should keep the newly opened menu available.
    if (hoverNavigation.matches && event.detail > 0 && openedByHover && dropdown.open) {
      event.preventDefault();
    }
    openedByHover = false;
  });

  hoverNavigation.addEventListener("change", closeDropdown);

  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  links.querySelectorAll("a").forEach((link) => {
    if ((link.pathname.replace(/\/$/, "") || "/") === currentPath) {
      link.setAttribute("aria-current", "page");
    }
  });

  const setOpen = (isOpen) => {
    nav.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");

    if (!isOpen) {
      closeDropdown();
    }
  };

  toggle.addEventListener("click", () => {
    setOpen(!nav.classList.contains("nav-open"));
  });

  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) {
      setOpen(false);
    } else if (dropdown && !dropdown.contains(event.target)) {
      closeDropdown();
    }
  });

  dropdown?.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !dropdown.contains(event.relatedTarget)) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (dropdown?.open) {
        closeDropdown();
        dropdown.querySelector("summary").focus();
      } else if (nav.classList.contains("nav-open")) {
        setOpen(false);
        toggle.focus();
      }
    }
  });
}

function scrollToHashTarget() {
  const hash = window.location.hash.slice(1);

  if (!hash) {
    return;
  }

  const scroll = () => {
    document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
  };

  requestAnimationFrame(scroll);
  window.setTimeout(scroll, 120);
}

async function renderPage() {
  if (!page) {
    throw new Error(`Unknown page: ${pageName}`);
  }

  preloadCurrentHeroImage();
  renderSeo();

  const headerPromise = loadHtml(site.components.headers[page.header]);
  const footerPromise = loadHtml(site.components.footers[page.footer]);
  const sectionNames = Array.isArray(page.sections) ? page.sections : [];
  const [firstSectionName, ...remainingSections] = sectionNames;
  const firstSectionPromise = firstSectionName ? loadSectionHtml(firstSectionName) : Promise.resolve("");

  document.getElementById("site-header").innerHTML = await headerPromise;
  bindMobileNav();
  renderDynamicSettings();
  renderLeadCaptureModal();
  bindLeadCapture();
  bindNativeLeadForms();
  bindScheduleModal();
  renderCtas();

  if (firstSectionName) {
    const main = document.getElementById("site-main");
    main.innerHTML = await firstSectionPromise;
    renderHeroImages();
    renderDynamicSettings();
    renderCtas();
  } else {
    renderHeroImages();
  }

  await renderSections(remainingSections, { clear: false });
  document.getElementById("site-footer").innerHTML = await footerPromise;
  renderLeadCaptureSlots();
  renderDynamicSettings();
  renderCtas();
  renderIntegrations();
  await renderWidgets();
  renderTracking();
  scrollToHashTarget();
}

renderPage().catch((error) => {
  document.body.innerHTML = `<main class="error"><h1>Template error</h1><p>${error.message}</p></main>`;
});
