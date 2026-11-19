const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function getField(formData, name, maxLength = 1000) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function getRequiredEnv(env) {
  const missing = [];
  const config = {
    apiKey: env.RESEND_API_KEY || "",
    fromEmail: env.RESEND_FROM_EMAIL || "",
    businessEmail: env.LEAD_TO_EMAIL || ""
  };

  if (!config.apiKey) {
    missing.push("RESEND_API_KEY");
  }

  if (!config.fromEmail) {
    missing.push("RESEND_FROM_EMAIL");
  }

  if (!config.businessEmail) {
    missing.push("LEAD_TO_EMAIL");
  }

  return { config, missing };
}

function createLead(formData) {
  return {
    name: getField(formData, "name", 120),
    email: getField(formData, "email", 180),
    phone: getField(formData, "phone", 80),
    service: getField(formData, "service", 160),
    message: getField(formData, "message", 3000),
    businessName: getField(formData, "businessName", 180),
    company: getField(formData, "company", 120),
    sendLeadConfirmation: getField(formData, "sendLeadConfirmation", 10)
  };
}

function validateLead(lead) {
  const errors = [];

  if (!lead.name) {
    errors.push("Name is required.");
  }

  if (!isValidEmail(lead.email)) {
    errors.push("A valid email is required.");
  }

  if (!lead.phone) {
    errors.push("Phone is required.");
  }

  if (!lead.service && !lead.message) {
    errors.push("Select a service or add a message so we know how to help.");
  }

  return errors;
}

function renderLeadDetails(lead) {
  const details = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Service", lead.service],
    ["Message", lead.message]
  ].filter(([, value]) => value);

  return details.map(([label, value]) => {
    return `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;
  }).join("");
}

function renderLeadText(lead) {
  const details = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone}`,
    lead.service ? `Service: ${lead.service}` : ""
  ].filter((line) => line !== "");

  if (lead.message) {
    details.push("", "Message:", lead.message);
  }

  return details.join("\n");
}

function buildBusinessEmail(config, lead) {
  const html = `
    <h1>New Lead: ${escapeHtml(lead.name)}</h1>
    <p>A new inquiry was submitted from the website.</p>
    <table cellpadding="8" cellspacing="0" border="0">
      ${renderLeadDetails(lead)}
    </table>
    <p>Powered by Vektor.Space</p>
  `;

  return {
    from: config.fromEmail,
    to: [config.businessEmail],
    reply_to: lead.email,
    subject: `New Lead: ${lead.name}`,
    html,
    text: [
      `New Lead: ${lead.name}`,
      "",
      "A new inquiry was submitted from the website.",
      "",
      renderLeadText(lead),
      "",
      "Powered by Vektor.Space"
    ].join("\n")
  };
}

function buildLeadConfirmationEmail(config, lead) {
  const businessName = lead.businessName || "the business";
  const subject = lead.businessName ? `${lead.businessName} received your message` : "We received your message";
  const html = `
    <h1>Thanks, ${escapeHtml(lead.name)}.</h1>
    <p>Thanks for contacting ${escapeHtml(businessName)}. We received your message and will follow up shortly.</p>
    <p>Here is a copy of what you sent:</p>
    <table cellpadding="8" cellspacing="0" border="0">
      ${renderLeadDetails(lead)}
    </table>
  `;

  return {
    from: config.fromEmail,
    to: [lead.email],
    reply_to: config.businessEmail,
    subject,
    html,
    text: `Thanks, ${lead.name}.\n\nThanks for contacting ${businessName}. We received your message and will follow up shortly.\n\n${renderLeadText(lead)}`
  };
}

async function sendResendEmail(config, payload) {
  const response = await fetch(RESEND_EMAILS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend returned ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function onRequestPost(context) {
  const formData = await context.request.formData();
  const lead = createLead(formData);

  if (lead.company) {
    return jsonResponse({
      ok: true,
      message: "Thanks. We received your request and will follow up shortly."
    });
  }

  const errors = validateLead(lead);

  if (errors.length) {
    return jsonResponse({
      ok: false,
      message: errors.join(" ")
    }, 400);
  }

  const { config, missing } = getRequiredEnv(context.env);

  if (missing.length) {
    console.error(`Missing lead form environment variables: ${missing.join(", ")}`);
    return jsonResponse({
      ok: false,
      message: "Lead delivery is not configured yet."
    }, 500);
  }

  try {
    const emails = [sendResendEmail(config, buildBusinessEmail(config, lead))];
    const confirmationDisabled = lead.sendLeadConfirmation === "false";

    if (!confirmationDisabled) {
      emails.push(sendResendEmail(config, buildLeadConfirmationEmail(config, lead)));
    }

    await Promise.all(emails);

    return jsonResponse({
      ok: true,
      message: "Thanks. We received your request and will follow up shortly."
    });
  } catch (error) {
    console.error(error);

    return jsonResponse({
      ok: false,
      message: "Sorry, something went wrong. Please try again or contact us directly."
    }, 502);
  }
}

function methodNotAllowed() {
  return new Response("Method not allowed", {
    status: 405,
    headers: {
      Allow: "POST"
    }
  });
}

export function onRequestGet() {
  return methodNotAllowed();
}

export function onRequestPut() {
  return methodNotAllowed();
}

export function onRequestPatch() {
  return methodNotAllowed();
}

export function onRequestDelete() {
  return methodNotAllowed();
}
