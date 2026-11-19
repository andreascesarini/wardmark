const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const WAITING_LIST_SUCCESS_MESSAGE = "Thank you. You’re on the waiting list.";

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
    phone: getField(formData, "phone", 32).replace(/[ ().-]/g, ""),
    smsMarketingConsent: formData.get("smsMarketingConsent") === "true",
    emailMarketingConsent: formData.get("emailMarketingConsent") === "true",
    organisation: getField(formData, "organisation", 180),
    message: getField(formData, "message", 3000),
    businessName: getField(formData, "businessName", 180),
    company: getField(formData, "company", 120),
    sendLeadConfirmation: getField(formData, "sendLeadConfirmation", 10)
  };
}

function validateLead(lead) {
  const errors = [];

  if (!lead.name) {
    errors.push("Full name is required.");
  }

  if (!isValidEmail(lead.email)) {
    errors.push("A valid work email is required.");
  }

  if (lead.phone && !/^\+[1-9]\d{6,14}$/.test(lead.phone)) {
    errors.push("Enter a valid mobile number with its country code, starting with +.");
  } else if (lead.smsMarketingConsent && !lead.phone) {
    errors.push("Enter your mobile number for marketing texts, or leave the SMS checkbox unchecked.");
  }

  if (!lead.organisation) {
    errors.push("Organisation is required.");
  }

  if (!lead.message) {
    errors.push("Tell us a little about your business.");
  }

  return errors;
}

function renderLeadDetails(lead) {
  const details = [
    ["Full name", lead.name],
    ["Work email", lead.email],
    ["Mobile number", lead.phone],
    ["Organisation", lead.organisation],
    ["Tell us a little about your business", lead.message],
    ["SMS marketing consent", lead.smsMarketingConsent ? "Yes" : "No"],
    ["Email marketing consent", lead.emailMarketingConsent ? "Yes" : "No"]
  ].filter(([, value]) => value);

  return details.map(([label, value]) => {
    return `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;
  }).join("");
}

function renderLeadText(lead) {
  const details = [
    `Full name: ${lead.name}`,
    `Work email: ${lead.email}`,
    `Organisation: ${lead.organisation}`
  ].filter((line) => line !== "");

  if (lead.message) {
    details.push("", "Tell us a little about your business:", lead.message);
  }

  if (lead.phone) details.push("", `Mobile number: ${lead.phone}`);
  details.push("", `SMS marketing consent: ${lead.smsMarketingConsent ? "Yes" : "No"}`);
  details.push(`Email marketing consent: ${lead.emailMarketingConsent ? "Yes" : "No"}`);

  return details.join("\n");
}

function buildBusinessEmail(config, lead) {
  const html = `
    <h1>Waiting list: ${escapeHtml(lead.name)}</h1>
    <p>A new waiting-list request was submitted from the website.</p>
    <table cellpadding="8" cellspacing="0" border="0">
      ${renderLeadDetails(lead)}
    </table>
    <p>Powered by Vektor.Space</p>
  `;

  return {
    from: config.fromEmail,
    to: [config.businessEmail],
    reply_to: lead.email,
    subject: `Waiting list: ${lead.name}`,
    html,
    text: [
      `Waiting list: ${lead.name}`,
      "",
      "A new waiting-list request was submitted from the website.",
      "",
      renderLeadText(lead),
      "",
      "Powered by Vektor.Space"
    ].join("\n")
  };
}

function buildLeadConfirmationEmail(config, lead) {
  const businessName = lead.businessName || "the business";
  const subject = lead.businessName ? `You’re on the ${lead.businessName} waiting list` : "You’re on the waiting list";
  const html = `
    <h1>Thanks, ${escapeHtml(lead.name)}.</h1>
    <p>${WAITING_LIST_SUCCESS_MESSAGE}</p>
    <p>Thanks for contacting ${escapeHtml(businessName)}. We’ll be in touch when spots open up again.</p>
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
    text: `Thanks, ${lead.name}.\n\n${WAITING_LIST_SUCCESS_MESSAGE}\n\nThanks for contacting ${businessName}. We’ll be in touch when spots open up again.\n\n${renderLeadText(lead)}`
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
  let formData;

  try {
    formData = await context.request.formData();
  } catch {
    return jsonResponse({ ok: false, message: "Please submit a valid form." }, 400);
  }

  const lead = createLead(formData);

  if (lead.company) {
    return jsonResponse({
      ok: true,
      message: WAITING_LIST_SUCCESS_MESSAGE
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
      message: "Sorry, something went wrong. Please try again or contact us directly."
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
      message: WAITING_LIST_SUCCESS_MESSAGE
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
