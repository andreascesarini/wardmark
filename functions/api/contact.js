const SUCCESS_MESSAGE = "Thank you. Your message has been sent.";
const ERROR_MESSAGE = "Sorry, your message could not be sent. Please try again.";

function jsonResponse(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function getField(formData, name, maxLength) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ ok: false, message: "Please submit a valid form." }, 400);
  }

  // Match the waiting-list form's honeypot without mixing the two workflows.
  if (getField(formData, "company", 120)) {
    return jsonResponse({ ok: true, message: SUCCESS_MESSAGE });
  }

  const enquiry = {
    name: getField(formData, "name", 120),
    email: getField(formData, "email", 180),
    organisation: getField(formData, "organisation", 180),
    subject: getField(formData, "subject", 180).replace(/[\r\n]+/g, " "),
    message: getField(formData, "message", 3000)
  };
  const errors = [];
  if (!enquiry.name) errors.push("Full name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) errors.push("A valid email address is required.");
  if (!enquiry.subject) errors.push("Subject is required.");
  if (!enquiry.message) errors.push("Please enter your message.");
  if (errors.length) return jsonResponse({ ok: false, message: errors.join(" ") }, 400);

  const recipient = env.CONTACT_TO_EMAIL || env.LEAD_TO_EMAIL;
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !recipient) {
    console.error("Contact email delivery is not configured.");
    return jsonResponse({ ok: false, message: ERROR_MESSAGE }, 500);
  }

  const details = [
    ["Full name", enquiry.name],
    ["Email address", enquiry.email],
    ["Organisation", enquiry.organisation],
    ["Subject", enquiry.subject],
    ["Message", enquiry.message]
  ].filter(([, value]) => value);
  const email = {
    from: env.RESEND_FROM_EMAIL,
    to: [recipient],
    reply_to: enquiry.email,
    subject: `Website enquiry: ${enquiry.subject}`,
    text: ["New Wardmark website enquiry", ...details.map(([label, value]) => `${label}: ${value}`)].join("\n\n"),
    html: `<h1>New Wardmark website enquiry</h1><table cellpadding="8" cellspacing="0" border="0">${details.map(([label, value]) => `<tr><th align="left" valign="top">${label}</th><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(email)
    });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
    return jsonResponse({ ok: true, message: SUCCESS_MESSAGE });
  } catch {
    console.error("Contact email delivery failed.");
    return jsonResponse({ ok: false, message: ERROR_MESSAGE }, 502);
  }
}
