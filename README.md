# Generic SMB Website Template

A small plain HTML/CSS/JS template system for local service businesses.

Mental model:

```text
Pages choose the pieces.
Headers, sections, footers, and widgets are the pieces.
site.config.js controls which pieces appear on each page.
site.settings.js holds reusable CTAs, tracking, lead capture, native lead fallback, and third-party integration placeholders.
_assets/js/app.js places those pieces into the page shell and creates the lead-capture modal.
```

Structure:

```text
index.html
404.html
site.config.js
site.settings.js

functions/
  api/
    lead.js          # Cloudflare Pages Function for native Resend lead capture

about/
  index.html
services/
  index.html        # redirects to /#services
  service-one/
    index.html
  service-two/
    index.html
  service-three/
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
/services/    Redirects to homepage services section
/services/service-one/    Primary service detail page
/services/service-two/    Secondary service detail page
/services/service-three/  Specialty service detail page
/about/       About page
/schedule/    Isolated booking/contact page for external redirects
/legal/...    Legal documents
/404.html     Missing page fallback
```

The homepage services section introduces the core offers and links directly to the individual service detail pages. The `/services/` route is intentionally not a composed page; it redirects to `/#services` for anyone who visits it directly.

The `/schedule/` page is intentionally isolated. It can be used as a redirect target from a scheduler or lead form, but the main navigation and footer do not link to it by default.

Images:

```text
The template ships without image assets.
Use the placeholder blocks in the section HTML until client media is added.
Place future client images in _assets/media/images/.
```

Widget display:

```text
Place the widget snippet in site.settings.js integrations.
Use components.widgets in site.config.js to choose which pages load it.
Example: integration: "chat", pages: ["home", "service-one"].
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
The primary CTA opens lead capture by convention.
Paste a custom lead form snippet into leadCapture.embed.html when the client uses an automation provider.
If the custom embed is blank, the modal renders a native form automatically.
The native form posts to leadCapture.native.endpoint, which defaults to /api/lead.
functions/api/lead.js receives that form in Cloudflare Pages and sends email through Resend.
The native path sends a business notification and, by default, a confirmation email to the lead.
Set leadCapture.native.sendLeadConfirmation to false when a generated site should not send a lead confirmation email.
```

Native lead capture environment:

```text
Configure these Cloudflare Pages Function variables/secrets:

RESEND_API_KEY          Secret. Resend API key.
RESEND_FROM_EMAIL      Verified sender, such as Leads <leads@example.com>.
LEAD_TO_EMAIL          Business recipient for lead notifications.
```

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

Service page copy pattern:

```text
1. Start from services/service-one/, services/service-two/, or services/service-three/.
2. Rename the folder and change body data-page to the new page key.
3. Copy the matching page recipe in site.config.js and update title, SEO, canonicalPath, and section keys.
4. Copy the matching _components/sections/services/service-* section folder.
5. Rename those section paths in site.config.js and update navigation/card links.
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
