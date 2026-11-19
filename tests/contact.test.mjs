import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [source, config, settings, app] = await Promise.all([
  readSource("../functions/api/contact.js"), readSource("../site.config.js"),
  readSource("../site.settings.js"), readSource("../_assets/js/app.js")
]);
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const fields = {
  name: "Alex Svensson", email: "alex@example.test", organisation: "",
  subject: "En fråga om behörigheter", message: "Can we discuss access reviews?", company: ""
};
const env = {
  RESEND_API_KEY: "test-key", RESEND_FROM_EMAIL: "Wardmark <contact@example.test>",
  LEAD_TO_EMAIL: "waiting-list@example.test", CONTACT_TO_EMAIL: "enquiries@example.test"
};
function request(overrides = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries({ ...fields, ...overrides })) body.set(key, value);
  return new Request("https://wardmark.test/api/contact", { method: "POST", body });
}

test("enquiry sends one email to the business with Reply-To, without a waiting-list signup", async (t) => {
  const deliveries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    deliveries.push(JSON.parse(options.body));
    return Response.json({ id: "test-delivery" });
  });
  const response = await onRequest({ request: request(), env });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, message: "Thank you. Your message has been sent." });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(deliveries.length, 1);
  assert.deepEqual(deliveries[0].to, [env.CONTACT_TO_EMAIL]);
  assert.equal(deliveries[0].reply_to, fields.email);
  assert.ok(deliveries[0].subject.includes(fields.subject));
  assert.ok(deliveries[0].text.includes(fields.message));
  assert.doesNotMatch(deliveries[0].text, /waiting list|marketing|Organisation:/i);
});

test("enquiry falls back to the existing recipient and escapes user content", async (t) => {
  const deliveries = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    deliveries.push(JSON.parse(options.body));
    return Response.json({ id: "test-delivery" });
  });
  const response = await onRequest({
    request: request({ organisation: "A & B", subject: "Access\nreview", message: "<script>alert(1)</script>\nSecond line" }),
    env: { ...env, CONTACT_TO_EMAIL: "" }
  });
  assert.equal(response.status, 200);
  assert.deepEqual(deliveries[0].to, [env.LEAD_TO_EMAIL]);
  assert.equal(deliveries[0].subject, "Website enquiry: Access review");
  assert.match(deliveries[0].html, /A &amp; B/);
  assert.match(deliveries[0].html, /&lt;script&gt;/);
  assert.match(deliveries[0].html, /<br>Second line/);
  assert.doesNotMatch(deliveries[0].html, /<script>/);
});

test("invalid and malformed enquiries never send email", async (t) => {
  t.mock.method(globalThis, "fetch", async () => assert.fail("Invalid enquiry must not send"));
  for (const override of [{ name: " " }, { email: "invalid" }, { subject: " " }, { message: " " }]) {
    const response = await onRequest({ request: request(override), env });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  const response = await onRequest({ request: new Request("https://wardmark.test/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
  }), env });
  assert.equal(response.status, 400);
});

test("honeypot and unsupported methods never send email", async (t) => {
  t.mock.method(globalThis, "fetch", async () => assert.fail("Spam or unsupported request must not send"));
  assert.equal((await onRequest({ request: request({ company: "spam" }), env })).status, 200);
  for (const method of ["GET", "PUT", "PATCH", "DELETE"]) {
    const response = await onRequest({ request: new Request("https://wardmark.test/api/contact", { method }), env });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
  }
});

test("missing configuration and provider failures never claim the message was sent", async (t) => {
  t.mock.method(console, "error", () => {});
  const mocked = t.mock.method(globalThis, "fetch", async () => new Response("Unavailable", { status: 503 }));
  const unconfigured = await onRequest({ request: request(), env: {} });
  assert.equal(unconfigured.status, 500);
  assert.equal((await unconfigured.json()).ok, false);
  assert.equal(mocked.mock.callCount(), 0);
  const rejected = await onRequest({ request: request(), env });
  assert.equal(rejected.status, 502);
  assert.equal((await rejected.json()).ok, false);
  mocked.mock.mockImplementation(async () => { throw new Error("Network failure"); });
  assert.equal((await onRequest({ request: request(), env })).status, 502);
});

function frontend() {
  const context = vm.createContext({
    window: {}, document: { body: { dataset: { page: "contact" } } },
    FormData: class extends FormData {
      constructor(form) { super(); for (const [key, value] of Object.entries(form.fields)) this.set(key, value); }
    }
  });
  vm.runInContext(config, context);
  vm.runInContext(settings, context);
  vm.runInContext(app.slice(0, app.lastIndexOf("renderPage().catch")), context);
  const button = { disabled: false, textContent: "Send message" };
  const status = { hidden: true, dataset: {}, textContent: "" };
  const form = {
    action: "https://wardmark.test/api/contact", fields: { ...fields }, resets: 0,
    reportValidity: () => true,
    reset() { this.resets++; },
    querySelector(selector) { return selector === "[data-native-contact-submit]" ? button : status; }
  };
  context.testForm = form;
  return { context, form, button, status };
}

test("email submission has its own confirmation and prevents duplicate sends while pending", async () => {
  const { context, form, button, status } = frontend();
  let finish;
  let sends = 0;
  context.fetch = async (url, options) => {
    sends++;
    assert.equal(url, form.action);
    assert.equal(options.body.get("subject"), fields.subject);
    assert.equal(options.body.get("smsMarketingConsent"), null);
    return new Promise((resolve) => { finish = resolve; });
  };
  const pending = vm.runInContext("submitNativeContactForm(testForm)", context);
  assert.equal(button.disabled, true);
  await vm.runInContext("submitNativeContactForm(testForm)", context);
  assert.equal(sends, 1);
  finish(Response.json({ ok: true }));
  await pending;
  assert.equal(form.resets, 1);
  assert.equal(status.textContent, "Thank you. Your message has been sent.");
  assert.equal(status.dataset.status, "success");
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Send message");
});

test("failed email submissions retain the message and restore the send button", async () => {
  for (const response of [Response.json({ ok: false }, { status: 502 }), new Response("not JSON")]) {
    const { context, form, button, status } = frontend();
    context.fetch = async () => response;
    await vm.runInContext("submitNativeContactForm(testForm)", context);
    assert.equal(form.resets, 0);
    assert.equal(form.fields.message, fields.message);
    assert.equal(status.dataset.status, "error");
    assert.equal(button.disabled, false);
  }
});
