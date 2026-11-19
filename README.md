# Wardmark Website

A plain HTML/CSS/JS website adapted from the generic SMB template for Wardmark.

## Wardmark content rollout

- The Services overview at `/services/` reuses the former `service-one` page shell and sections, now under `_components/sections/services/overview/`. Its supplied copy, SEO, FAQ, and waiting-list CTA are implemented.
- Active Directory & Entra ID Security at `/services/active-directory-entra-id-security/` reuses the former `service-two` page and sections. Its supplied copy, SEO, review scope, hardening plan, FAQ, and shared waiting-list CTA are implemented.
- Identity Architecture & Migration at `/services/identity-architecture-migration/` reuses the former `service-three` page and sections. Its supplied copy, SEO, architecture scope, migration approach, FAQ, and shared waiting-list CTA are implemented.
- Access Governance at `/services/access-governance/` uses a copy of the existing Identity Architecture & Migration page shell and sections, adapted with its supplied copy, SEO, FAQ, and shared waiting-list CTA. The completed source page is preserved.
- AI Agent Identity Readiness at `/services/ai-agent-identity-readiness/` uses a copy of the existing Access Governance page shell and sections, adapted with its supplied copy, SEO, FAQ, and shared waiting-list CTA. The completed source page is preserved.
- Contact at `/contact/` has a separate email enquiry form with Full name, Email address, optional Organisation, Subject, and Your message. Waiting-list buttons open the shared signup modal, including on Contact.
- Homepage and About now use the supplied Wardmark copy and SEO. The homepage follows the supplied hero/style reference, with a dark introduction, four service cards, comparison, engagement process, founder biography, FAQ, and waiting-list CTA. About retains Andreas’s first-person voice.
- All three original service templates have been repurposed. No unused service template pages, component folders, or configuration/navigation references remain.
- All four supplied service-detail pages are implemented: Active Directory & Entra ID Security, Identity Architecture & Migration, Access Governance, and AI Agent Identity Readiness. The overview links and service FAQ cross-links resolve to these pages.
- The shared header, footer, primary CTA, and native waiting-list form now use Wardmark information. Set `business.websiteUrl` when the production domain is provided. Native email delivery still requires the Cloudflare/Resend environment configuration below.

Mental model:

```text
Pages choose the pieces.
Headers, sections, footers, and widgets are the pieces.
site.config.js controls which pieces appear on each page.
site.settings.js holds reusable CTAs, tracking, lead capture, native lead fallback, and third-party integration placeholders.
_assets/js/app.js places those pieces into the page shell and creates the lead-capture modal.
```

Visual design:

- `_assets/css/wardmark.css` is the shared navy-and-gold visual layer, loaded after `base.css` by every page shell. It includes responsive layouts and reduced-motion support.
- `_assets/media/images/wardmark-hero.png` is the supplied hero image, unchanged. `site.settings.js` assigns it to the homepage with eager loading and high fetch priority. Desktop keeps the artwork on the right; mobile places it below the copy.
- `_assets/icons/wardmark-mark.svg` provides the W-and-castle brand treatment based on the visual reference.
- Homepage and About omit generic media, review, and location placeholders that have no corresponding supplied content.
- Local visual QA artifacts are stored in the ignored `.qa/` directory. The browser check uses an isolated Chrome profile and mocks the waiting-list response; it sends no email.

Structure:

```text
index.html
404.html
site.config.js
site.settings.js

functions/
  api/
    lead.js          # Cloudflare Pages Function for native Resend lead capture
    contact.js       # Separate email enquiries; replies go to the sender

about/
  index.html
contact/
  index.html
services/
  index.html        # Wardmark Services overview (repurposed service-one)
  active-directory-entra-id-security/
    index.html
  identity-architecture-migration/
    index.html
  access-governance/
    index.html
  ai-agent-identity-readiness/
    index.html
schedule/
  index.html

legal/
  terms-and-conditions/
    index.html
  privacy-policy/
    index.html

_assets/
  css/base.css
  css/wardmark.css
  js/app.js
  media/images/
  media/videos/

_components/
  headers/main.html
  headers/minimal.html
  footers/main.html
  footers/minimal.html
  sections/home/
  sections/services/
  sections/about/
  sections/contact/
  sections/reviews.html
  sections/schedule.html
  sections/schedule-booking.html
  sections/location-contact.html
  sections/faq.html
  sections/final-cta.html
```

Pages:

```text
/             Homepage
/services/    Wardmark Services overview
/services/active-directory-entra-id-security/    Active Directory & Entra ID Security
/services/identity-architecture-migration/      Identity Architecture & Migration
/services/access-governance/                   Access Governance
/services/ai-agent-identity-readiness/          AI Agent Identity Readiness
/about/       About page
/contact/     Email enquiry form and access to the waiting-list modal
/schedule/    Isolated booking/contact page for external redirects
/legal/...    Legal documents
/404.html     Missing page fallback
```

The `/services/` route and the homepage services section both link to all four implemented Wardmark service-detail pages.

The `/schedule/` page is intentionally isolated. It can be used as a redirect target from a scheduler or lead form, but the main navigation and footer do not link to it by default.

Images:

```text
The supplied homepage hero is stored at _assets/media/images/wardmark-hero.png.
Place any future client images in _assets/media/images/.
```

Widget display:

```text
Place the widget snippet in site.settings.js integrations.
Use components.widgets in site.config.js to choose which pages load it.
Example: integration: "chat", pages: ["home", "services"].
```

Map display:

```text
The contact section renders a Google Maps iframe from business.address by default.
Set integrations.map.autoFromAddress to false to disable that fallback.
Paste a custom Google Maps iframe into integrations.map.html when a client needs a specific embed.
Custom map HTML always overrides the address-generated iframe.
```

Lead capture:

```text
The primary CTA opens the waiting-list modal, including on /contact/.
The waiting-list form requires Full name, Work email, Organisation, and Tell us a little about your business.
Organisation is submitted as organisation; the separate hidden company field remains a spam honeypot.
Mobile number is optional and should include a country code.
Email marketing has an optional, unchecked consent box. The SMS checkbox and its explanatory note have been removed from the form; providing a number alone is not SMS consent.
The form includes email unsubscribe information and legal links.
The native endpoint records each channel's choice in the business notification and lead confirmation; unchecked or missing choices are No.
The current consent UI is a mockup using Wardmark as the business name. Legal pages and contact details remain templates.
Before live marketing, complete the policies and sender details, retain consent evidence, and configure the messaging provider to enforce opt-ins, STOP/HELP and email unsubscribes.
No GHL marketing workflow or SMS sending is configured by the native form.
The success confirmation is: Thank you. You’re on the waiting list.
Paste a custom lead form snippet into leadCapture.embed.html when the client uses an automation provider.
If the custom embed is blank, the modal renders a native form automatically.
The native form posts to leadCapture.native.endpoint, which defaults to /api/lead.
functions/api/lead.js receives that form in Cloudflare Pages and sends email through Resend.
The native path sends a business notification and, by default, a confirmation email to the lead.
Both emails include the organisation and business description. Confirmation copy reflects current waiting-list availability.
Set leadCapture.native.sendLeadConfirmation to false when a generated site should not send a lead confirmation email.
```

Native lead capture environment:

```text
Configure these Cloudflare Pages Function variables/secrets:

RESEND_API_KEY          Secret. Resend API key.
RESEND_FROM_EMAIL      Verified sender, such as Leads <leads@example.com>.
LEAD_TO_EMAIL          Business recipient for lead notifications.
CONTACT_TO_EMAIL       Optional separate enquiry recipient; falls back to LEAD_TO_EMAIL.
```

The contact form posts to `/api/contact`. It sends one enquiry email to the business with the visitor's email as Reply-To; it does not join the waiting list, send a signup confirmation, or grant marketing consent. Delivery uses the same Resend credentials as lead capture. A successful send shows “Thank you. Your message has been sent.” Failed sends preserve the visitor's message. Email sending remains disabled in the static local mockup.

Tracking:

```text
Use site.settings.js tracking.googleAnalyticsId for GA4.
Use site.settings.js tracking.metaPixelId for Meta Pixel.
Leave either value blank to keep it disabled.
```

SEO:

```text
Configure page SEO in each site.config.js page recipe.
Use seo.metaTitle for the browser/search title.
Use seo.metaDescription for the page description.
Use seo.canonicalPath to match the public URL, such as /about/.
Use seo.focusKeyword as an internal planning note; it is not rendered into the page.
If you change a URL, rename the folder that contains that page's index.html and update links/canonicalPath.
The root _headers file adds X-Robots-Tag: noindex to Cloudflare *.pages.dev URLs only.
Custom domains remain indexable unless a page recipe sets seo.robots to noindex.
```

Legal pages:

```text
Legal pages can keep their document content directly inside the page file.
Register them in site.config.js without a sections array to keep that inline content.
Use data-setting="business.name" style placeholders to load business and legal facts from site.settings.js.
```

Service template reuse:

```text
service-one   -> /services/
service-two   -> /services/active-directory-entra-id-security/
service-three -> /services/identity-architecture-migration/

Access Governance reuses a copy of the completed Identity Architecture &
Migration template structure, with its own copy and metadata.
AI Agent Identity Readiness reuses a copy of the completed Access Governance
template structure, with its own copy and metadata.

All original templates are assigned. Their page keys, section paths, metadata,
and incoming links have been updated. No unused service templates remain to
remove when the user moves on from service-page content.
```

Run locally:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The plain Python server renders the static template but does not execute Cloudflare Pages Functions. The native lead endpoint runs when deployed on Cloudflare Pages or in a Cloudflare Pages local development environment.

Waiting-list validation:

```bash
node --test tests/waiting-list.test.mjs tests/contact.test.mjs
```

These tests mock email delivery; they do not send email or require production secrets.
