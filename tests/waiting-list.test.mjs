import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [endpointSource, configSource, settingsSource, appSource] = await Promise.all([
  readSource("../functions/api/lead.js"),
  readSource("../site.config.js"),
  readSource("../site.settings.js"),
  readSource("../_assets/js/app.js")
]);
const endpoint = await import(`data:text/javascript;base64,${Buffer.from(endpointSource).toString("base64")}`);
const confirmation = "Thank you. You’re on the waiting list.";
const validFields = {
  name: "Alex Svensson",
  email: "alex@example.test",
  phone: "",
  organisation: "Ångström & Co",
  message: "Vi arbetar med finansiell infrastruktur.",
  businessName: "Wardmark",
  sendLeadConfirmation: "true",
  company: ""
};
const environment = {
  RESEND_API_KEY: "test-key",
  RESEND_FROM_EMAIL: "Wardmark <waiting-list@example.test>",
  LEAD_TO_EMAIL: "business@example.test"
};

function makeRequest(overrides = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries({ ...validFields, ...overrides })) {
    body.set(key, value);
  }
  return new Request("https://wardmark.test/api/lead", { method: "POST", body });
}

function frontend() {
  const context = vm.createContext({
    window: {},
    document: { body: { dataset: { page: "contact" } } },
    FormData: class extends FormData {
      constructor(form) {
        super();
        for (const [key, value] of Object.entries(form.fields)) this.set(key, value);
      }
    }
  });
  vm.runInContext(configSource, context);
  vm.runInContext(settingsSource, context);
  vm.runInContext(appSource.slice(0, appSource.lastIndexOf("renderPage().catch")), context);
  return context;
}

function formFixture() {
  const button = { disabled: false, textContent: "Join the waiting list" };
  const status = { hidden: true, dataset: {}, textContent: "" };
  const form = {
    action: "https://wardmark.test/api/lead",
    fields: { ...validFields },
    resets: 0,
    reportValidity: () => !phone.validationMessage,
    reset() {
      this.resets++;
      this.fields.phone = "";
      delete this.fields.smsMarketingConsent;
      delete this.fields.emailMarketingConsent;
    },
    querySelector(selector) {
      return selector === "[data-native-lead-submit]" ? button : status;
    }
  };
  const phone = {
    get value() { return form.fields.phone || ""; },
    validationMessage: "",
    setCustomValidity(message) { this.validationMessage = message; }
  };
  form.elements = {
    namedItem(name) { return name === "phone" ? phone : null; }
  };
  return { form, button, status };
}

test("shared form has optional mobile and email consent without the SMS block or note", () => {
  const context = frontend();
  const html = vm.runInContext("renderNativeLeadForm()", context);
  const visibleLabels = [...html.matchAll(/<label class="form-field">\s*([^<]+)<(?:input|textarea)[^>]*name="([^"]+)"/g)]
    .map((match) => [match[1].trim(), match[2]]);
  assert.deepEqual(visibleLabels, [
    ["Full name", "name"],
    ["Work email", "email"],
    ["Mobile number (optional)", "phone"],
    ["Organisation", "organisation"],
    ["Tell us a little about your business", "message"]
  ]);
  assert.match(html, /name="company" tabindex="-1"/);
  assert.doesNotMatch(html, /name="service"/);
  const phone = html.match(/<input[^>]*name="phone"[^>]*>/)[0];
  assert.doesNotMatch(phone, /\brequired\b/);
  const checkboxes = [...html.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map(([input]) => input);
  assert.equal(checkboxes.length, 1);
  for (const input of checkboxes) assert.doesNotMatch(input, /\b(?:checked|required)\b/);
  assert.match(checkboxes[0], /name="emailMarketingConsent" value="true"/);
  assert.doesNotMatch(html, /smsMarketingConsent|form-consent-note|marketing text messages/);
  assert.match(html, /href="\/legal\/privacy-policy\/"/);
  assert.match(html, /href="\/legal\/terms-and-conditions\/"/);
  assert.match(html, /data-native-lead-submit>Join the waiting list<\/button>/);
  assert.equal(context.window.SiteSettings.leadCapture.native.successMessage, confirmation);
});

test("CTA scrolls to an inline waiting-list form when one is explicitly present", () => {
  const context = frontend();
  let scrolled = false;
  let focused = false;
  const slot = {
    scrollIntoView() { scrolled = true; },
    querySelector() { return { focus() { focused = true; } }; }
  };
  context.document.querySelector = () => slot;
  vm.runInContext("openLeadCapture()", context);
  assert.ok(scrolled);
  assert.ok(focused);
});

test("successful client submission shows the exact confirmation and restores the button", async () => {
  const context = frontend();
  const { form, button, status } = formFixture();
  context.testForm = form;
  context.fetch = async (url, options) => {
    assert.equal(url, form.action);
    assert.equal(options.body.get("organisation"), validFields.organisation);
    assert.equal(options.body.get("phone"), "");
    assert.equal(options.body.get("smsMarketingConsent"), null);
    assert.equal(options.body.get("emailMarketingConsent"), null);
    return Response.json({ ok: true, message: "A provider-specific success message" });
  };
  await vm.runInContext("submitNativeLeadForm(testForm)", context);
  assert.equal(status.textContent, confirmation);
  assert.equal(status.dataset.status, "success");
  assert.equal(status.hidden, false);
  assert.equal(form.resets, 1);
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Join the waiting list");
});

test("invalid form does not submit", async () => {
  const context = frontend();
  const { form } = formFixture();
  form.reportValidity = () => false;
  context.testForm = form;
  context.fetch = async () => assert.fail("Invalid form must not submit");
  await vm.runInContext("submitNativeLeadForm(testForm)", context);
  assert.equal(form.resets, 0);
});

test("optional mobile number is validated when supplied and can be cleared", async () => {
  const context = frontend();
  const { form } = formFixture();
  context.testForm = form;
  form.fields.phone = "0701234567";
  context.fetch = async () => assert.fail("Invalid mobile number must not submit");
  await vm.runInContext("submitNativeLeadForm(testForm)", context);
  assert.match(form.elements.namedItem("phone").validationMessage, /mobile number/);
  assert.equal(form.resets, 0);

  form.fields.phone = "";
  context.fetch = async () => Response.json({ ok: true });
  await vm.runInContext("submitNativeLeadForm(testForm)", context);
  assert.equal(form.elements.namedItem("phone").validationMessage, "");
  assert.equal(form.resets, 1);
});

test("client preserves form data and shows an error on delivery failure or invalid response", async (t) => {
  for (const response of [
    () => Response.json({ ok: false, message: "Please try again." }, { status: 502 }),
    () => new Response("not JSON", { status: 200 })
  ]) {
    await t.test(response().status.toString(), async () => {
      const context = frontend();
      const { form, button, status } = formFixture();
      context.testForm = form;
      context.fetch = async () => response();
      await vm.runInContext("submitNativeLeadForm(testForm)", context);
      assert.equal(status.dataset.status, "error");
      assert.equal(form.resets, 0);
      assert.equal(form.fields.organisation, validFields.organisation);
      assert.equal(button.disabled, false);
    });
  }
});

test("endpoint accepts all four fields without phone or service and includes them in both emails", async (t) => {
  const deliveries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    deliveries.push(JSON.parse(options.body));
    return Response.json({ id: "test-delivery" });
  });
  const response = await endpoint.onRequestPost({ request: makeRequest(), env: environment });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, message: confirmation });
  assert.equal(deliveries.length, 2);
  assert.deepEqual(deliveries[0].to, [environment.LEAD_TO_EMAIL]);
  assert.deepEqual(deliveries[1].to, [validFields.email]);
  for (const email of deliveries) {
    assert.match(email.html, /Ångström &amp; Co/);
    assert.ok(email.text.includes(validFields.organisation));
    assert.ok(email.text.includes(validFields.message));
    assert.doesNotMatch(email.text, /Phone:|Service:|follow up shortly/);
    assert.match(email.text, /SMS marketing consent: No/);
    assert.match(email.text, /Email marketing consent: No/);
  }
  assert.ok(deliveries[1].text.includes(confirmation));
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("endpoint preserves SMS and email choices independently and normalises mobile numbers", async (t) => {
  const deliveries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    deliveries.push(JSON.parse(options.body));
    return Response.json({ id: "test-delivery" });
  });
  for (const [sms, email] of [[false, false], [true, false], [false, true], [true, true]]) {
    deliveries.length = 0;
    const response = await endpoint.onRequestPost({
      request: makeRequest({ phone: "+46 70 123 45 67", smsMarketingConsent: String(sms), emailMarketingConsent: String(email) }),
      env: environment
    });
    assert.equal(response.status, 200);
    assert.equal(deliveries.length, 2);
    for (const delivery of deliveries) {
      assert.ok(delivery.text.includes(`SMS marketing consent: ${sms ? "Yes" : "No"}`));
      assert.ok(delivery.text.includes(`Email marketing consent: ${email ? "Yes" : "No"}`));
      assert.match(delivery.text, /Mobile number: \+46701234567/);
    }
  }
});

test("endpoint never treats an arbitrary checkbox value as affirmative consent", async (t) => {
  const deliveries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    deliveries.push(JSON.parse(options.body));
    return Response.json({ id: "test-delivery" });
  });
  const response = await endpoint.onRequestPost({
    request: makeRequest({ smsMarketingConsent: "false", emailMarketingConsent: "on" }),
    env: environment
  });
  assert.equal(response.status, 200);
  for (const delivery of deliveries) {
    assert.match(delivery.text, /SMS marketing consent: No/);
    assert.match(delivery.text, /Email marketing consent: No/);
  }
});

test("endpoint rejects SMS opt-in without a mobile number and invalid supplied numbers", async (t) => {
  t.mock.method(globalThis, "fetch", async () => assert.fail("Invalid consent requests must not send email"));
  for (const fields of [
    { smsMarketingConsent: "true", phone: "" },
    { phone: "0701234567" },
    { phone: "+46-invalid" },
    { phone: "+1234567890123456" }
  ]) {
    const response = await endpoint.onRequestPost({ request: makeRequest(fields), env: environment });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
});

test("endpoint rejects empty required fields and invalid work email", async (t) => {
  t.mock.method(globalThis, "fetch", async () => assert.fail("Invalid requests must not send email"));
  for (const override of [
    { name: " " }, { email: " " }, { email: "invalid" },
    { organisation: " " }, { message: " " }
  ]) {
    const response = await endpoint.onRequestPost({ request: makeRequest(override), env: environment });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
});

test("honeypot blocks spam without treating the genuine Organisation field as spam", async (t) => {
  t.mock.method(globalThis, "fetch", async () => assert.fail("Honeypot submissions must not send email"));
  const response = await endpoint.onRequestPost({ request: makeRequest({ company: "spam" }), env: environment });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, confirmation);
});

test("notification escapes user content and optional confirmation can be disabled", async (t) => {
  const deliveries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    deliveries.push(JSON.parse(options.body));
    return Response.json({ id: "test-delivery" });
  });
  const response = await endpoint.onRequestPost({
    request: makeRequest({ organisation: "<script>alert(1)</script>", sendLeadConfirmation: "false" }),
    env: environment
  });
  assert.equal(response.status, 200);
  assert.equal(deliveries.length, 1);
  assert.doesNotMatch(deliveries[0].html, /<script>/);
  assert.match(deliveries[0].html, /&lt;script&gt;/);
});

test("unconfigured delivery and provider errors do not report a successful signup", async (t) => {
  t.mock.method(console, "error", () => {});
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("Unavailable", { status: 503 }));
  const unconfigured = await endpoint.onRequestPost({ request: makeRequest(), env: {} });
  assert.equal(unconfigured.status, 500);
  assert.equal((await unconfigured.json()).ok, false);
  assert.equal(fetch.mock.callCount(), 0);
  const failed = await endpoint.onRequestPost({ request: makeRequest(), env: environment });
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).ok, false);
});

test("malformed form submission returns a validation error", async () => {
  const request = new Request("https://wardmark.test/api/lead", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
  });
  const response = await endpoint.onRequestPost({ request, env: environment });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).ok, false);
});
