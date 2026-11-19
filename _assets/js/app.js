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

    let imageElement = hero.querySelector(":scope > .hero-background-image");

    if (!imageElement) {
      imageElement = document.createElement("img");
      imageElement.className = "hero-background-image";
      hero.prepend(imageElement);
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

function renderServiceOptions(options) {
  return options.map((option) => {
    return `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`;
  }).join("");
}

function renderNativeLeadForm() {
  const native = getNativeLeadCaptureSettings();
  const endpoint = getSettingValue(native.endpoint) || "/api/lead";
  const confirmation = native.sendLeadConfirmation === false ? "false" : "true";
  const serviceOptions = Array.isArray(native.serviceOptions) ? native.serviceOptions : [];
  const serviceField = serviceOptions.length
    ? `
      <label class="form-field">
        Service
        <select name="service">
          <option value="">Select a service</option>
          ${renderServiceOptions(serviceOptions)}
        </select>
      </label>
    `
    : `
      <label class="form-field">
        Service
        <input type="text" name="service" autocomplete="off">
      </label>
    `;

  return `
    <form class="lead-capture-form" action="${escapeHtml(endpoint)}" method="post" data-native-lead-form>
      <input type="hidden" name="sendLeadConfirmation" value="${confirmation}">
      <input type="hidden" name="businessName" value="${escapeHtml(settings.business?.name || "")}">

      <label class="form-field lead-form-honeypot">
        Company
        <input type="text" name="company" tabindex="-1" autocomplete="off">
      </label>

      <label class="form-field">
        Name *
        <input type="text" name="name" autocomplete="name" required>
      </label>

      <label class="form-field">
        Email *
        <input type="email" name="email" autocomplete="email" required>
      </label>

      <label class="form-field">
        Phone *
        <input type="tel" name="phone" autocomplete="tel" required>
      </label>

      ${serviceField}

      <label class="form-field">
        Message
        <textarea name="message" rows="5"></textarea>
      </label>
      <p class="form-help">Select a service or add a message so we know how to help.</p>

      <button class="button" type="submit" data-native-lead-submit>Send Inquiry</button>
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

function renderLeadCaptureModal() {
  const modalRoot = document.createElement("div");
  modalRoot.id = "site-modals";
  document.body.append(modalRoot);

  modalRoot.innerHTML = `
    <div class="lead-modal" id="lead-modal" hidden>
      <div class="lead-modal-backdrop" data-lead-capture-close></div>
      <div class="lead-modal-panel" role="dialog" aria-modal="true" aria-label="Lead capture">
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
  return native.successMessage || "Thanks. We received your request and will follow up shortly.";
}

function getNativeLeadErrorMessage() {
  const native = getNativeLeadCaptureSettings();
  return native.errorMessage || "Sorry, something went wrong. Please try again or contact us directly.";
}

function setLeadFormStatus(form, message, type) {
  const status = form.querySelector("[data-native-lead-status]");

  if (!status) {
    return;
  }

  status.textContent = message;
  status.hidden = false;
  status.dataset.status = type;
}

function hasLeadContext(form) {
  const formData = new FormData(form);
  return getSettingValue(formData.get("service")) || getSettingValue(formData.get("message"));
}

async function submitNativeLeadForm(form) {
  const submitButton = form.querySelector("[data-native-lead-submit]");
  const originalLabel = submitButton?.textContent;

  if (!hasLeadContext(form)) {
    setLeadFormStatus(form, "Select a service or add a message so we know how to help.", "error");
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  setLeadFormStatus(form, "", "pending");

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: {
        Accept: "application/json"
      }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
      throw new Error(data.message || getNativeLeadErrorMessage());
    }

    form.reset();
    setLeadFormStatus(form, data.message || getNativeLeadSuccessMessage(), "success");
  } catch (error) {
    setLeadFormStatus(form, error.message || getNativeLeadErrorMessage(), "error");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  }
}

function bindNativeLeadForms() {
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-native-lead-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    submitNativeLeadForm(form);
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

  const setOpen = (isOpen) => {
    nav.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");

    if (!isOpen) {
      nav.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => {
        dropdown.removeAttribute("open");
      });
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
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
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
