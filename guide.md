# Form-Gated Page — Build Guide

## Architecture

**Flow:** Hero + preview → Gate (form) → Turnstile → POST to forms.oyenino.com → Reveal hidden content → SessionStorage persists unlock

**Purpose:** Lead capture before giving away free prompts. Collects name/phone/email + device/location fingerprint.

---

## File Layout

| What | Where |
|------|-------|
| Page HTML | `/your-page.html` at project root (standalone, NOT Astro) |
| Shared validation | `/form-utils.js` (never modify, just reference) |
| Optional dynamic data | `/your-page-data.json` |

## Two Patterns

**Pattern A (Static):** Content in same HTML, hidden div. Used by `booking-prompt.html`.  
**Pattern B (Dynamic):** Content fetched from JSON after unlock. Used by `salon-booking-prompt.html`.

---

## Page Structure Order

```
1. <nav>            — logo + links + mobile toggle
2. <header>         — badge, h1, description (page-hero)
3. showcase         — code blocks, screenshots, feature list
4. #gate-section    — THE GATE (form card)
5. #prompt-content  — hidden content (revealed after form)
6. <footer>         — links, social, copyright
7. <script>         — form-utils.js + page init
```

---

## Required `<head>` Elements

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BGL94NLVL7"></script>
<script>
  window.dataLayer=window.dataLayer||[];
  function gtag(){dataLayer.push(arguments);}
  gtag("js",new Date());
  gtag("config","G-BGL94NLVL7");
</script>

<!-- Cloudflare Turnstile -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

---

## CSS Variables (site theme — must use these)

```css
:root {
  --bg: #050505;
  --bg-card: #111111;
  --text: #eeeae4;
  --text-muted: #706c66;
  --accent: #00f0a0;
  --accent-glow: rgba(0,240,160,0.15);
  --accent-glow-strong: rgba(0,240,160,0.25);
  --border: #1a1a1a;
  --sans: "Outfit", system-ui, sans-serif;
}
```

---

## Gate Section HTML

**Critical IDs — must match exactly:**

```html
<div class="gate-wrap" id="gate-section">
  <div class="gate-card">
    <div class="gate-title">Get the prompt — free hai</div>
    <div class="gate-subtitle">Apna details daalo, <strong>turant unlock.</strong></div>

    <form id="gateForm" novalidate>
      <!-- Name -->
      <div class="form-group">
        <label for="gate-name">Your Name *</label>
        <input type="text" id="gate-name" name="name" placeholder="Your Name" required />
      </div>

      <!-- Phone -->
      <div class="form-group">
        <label for="gate-phone">Phone Number *</label>
        <input type="tel" id="gate-phone" name="phone" placeholder="+91 98765 43210" required />
        <div class="field-status" id="phoneStatus"></div>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="gate-email">Email Address *</label>
        <input type="email" id="gate-email" name="email" placeholder="your@email.com" required />
        <div class="field-status" id="emailStatus"></div>
      </div>

      <!-- Turnstile CAPTCHA -->
      <div class="cf-turnstile"
        data-sitekey="0x4AAAAAACgSvRvZpT5d_Ab5"
        data-theme="dark"
        data-callback="onTurnstileSuccess"
        data-expired-callback="onTurnstileExpired"
        style="margin-bottom:1rem; display:flex; justify-content:center;">
      </div>

      <div class="error-msg" id="formError"></div>
      <button type="submit" class="btn-unlock" id="unlockBtn" disabled>
        Sab fields fill karo
      </button>
      <p class="gate-privacy">Your info safe hai. Kabhi bhi unsubscribe kar sakte ho.</p>
    </form>
  </div>
</div>

<!-- HIDDEN CONTENT — revealed after form submit -->
<div id="prompt-content">
  <!-- Your unlocked content here -->
</div>
```

---

## JavaScript Initialization (before `</body>`)

```html
<script src="/form-utils.js"></script>
<script>
  // Auto-unlock if already submitted this session
  if (sessionStorage.getItem("PAGE_NAME_unlocked") === "true") showPrompt();

  // Initialize form validation + submission
  new OyeNinoForm({
    formId: "gateForm",
    emailId: "gate-email",
    phoneId: "gate-phone",
    nameId: "gate-name",
    btnId: "unlockBtn",
    statusId: "emailStatus",
    phoneStatusId: "phoneStatus",
    errorId: "formError",
    formName: "page_name_gate",         // UNIQUE per page — used in GA4 events
    requiredFields: ["name", "email", "phone"],
    btnTexts: {
      ready: "🔓 Prompt Unlock Karo — Free",
      turnstile: "Verify you're human first ↑",
      email: "Valid email daalo pehle",
      phone: "Valid phone number daalo",
      fields: "Sab fields fill karo",
      submitting: "⏳ Submitting..."
    },
    onSuccess: function () {
      sessionStorage.setItem("PAGE_NAME_unlocked", "true");
      showPrompt();
    }
  });

  // Reveal function
  function showPrompt() {
    var gate = document.getElementById("gate-section");
    gate.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    gate.style.opacity = "0";
    gate.style.transform = "translateY(-10px)";
    setTimeout(function () {
      gate.style.display = "none";
      document.getElementById("prompt-content").classList.add("unlocked");
      document.getElementById("prompt-content").scrollIntoView({ behavior: "smooth" });
    }, 400);
  }

  // Copy helper
  function copyPrompt(id, btn) { oyeCopyPrompt(id, btn); }
</script>
```

---

## Per-Page Customization Checklist

| Item | What to change |
|------|---------------|
| `formName` | Unique string like `"job_hunter_gate"` — drives GA4 event names |
| `sessionStorage` key | Must match in both the check AND onSuccess (e.g. `"job_hunter_unlocked"`) |
| `<title>` + meta tags | SEO title, description, OG image |
| Hero section | Page-specific badge, h1, subtitle, preview content |
| `#prompt-content` | Your actual prompt text, steps, CTAs |
| Nav link | Add page to nav dropdown + `prompts.html` listing |
| `btnTexts` | Customize button copy if needed |

---

## What `form-utils.js` Handles Automatically (don't rewrite)

### Email Validation
- Format regex check
- Disposable domain blocking (57+ domains: tempmail, mailinator, guerrillamail, etc.)
- Typo correction suggestions (77 mappings: gmial→gmail, yaho→yahoo, etc.)
- MX record verification via Google DNS API (600ms debounce)

### Phone Validation
- Indian format: +91/0/bare 10-digit starting with 6-9
- International: E.164 compliant (`+[1-9]\d{5,14}`)
- Auto-formatting on blur: `+91 XXXXX XXXXX`

### Device Fingerprint (auto-collected)
- User Agent, Platform, Language
- Screen size, Viewport size
- Timezone, Touch support
- Device type (Mobile/Tablet/Desktop)
- Browser (Chrome/Safari/Firefox/Edge/Opera)
- OS (Windows/macOS/Android/iOS/Linux)

### Geolocation (auto-collected via ipapi.co)
- IP, City, Region, Country, Coordinates, ISP

### Turnstile
- Callback wiring (`onTurnstileSuccess` / `onTurnstileExpired`)
- Token extraction from hidden input
- Auto-reset on 403 rejection

### Button State Management
- Disabled until: all fields filled + email valid + phone valid + turnstile passed
- Real-time message updates based on what's missing

### Form Submission
- POST to `https://forms.oyenino.com`
- Full payload: form data + device + location + turnstile token
- Error handling:
  - 200 → success → onSuccess callback
  - 422 → email rejected by server → refocus email field
  - 403 → turnstile failed → reset widget
  - 429 → rate limited → show error
  - Network error → show connection message

### GA4 Events Tracked
- `turnstile_verified`
- `email_mx_verified` / `email_mx_failed`
- `email_typo_fixed`
- `{formName}_submit`
- `{formName}_success`
- `{formName}_error`
- `{formName}_network_error`
- `rate_limited`
- `turnstile_server_rejected`

---

## CSS for Hidden → Revealed Content

```css
#prompt-content {
  display: none;
}
#prompt-content.unlocked {
  display: block;
  animation: fadeUp 0.7s ease forwards;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Gate Card Styling (key classes)

```css
.gate-wrap { max-width: 520px; margin: 5rem auto; padding: 0 2rem; }
.gate-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2.5rem;
  position: relative;
}
.gate-card::before {  /* green top accent line */
  content: "";
  position: absolute; top: 0; left: 2rem; right: 2rem;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent 60%);
}
.gate-title { font-size: 1.5rem; margin-bottom: 0.4rem; }
.gate-subtitle { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.75rem; }
.form-group { margin-bottom: 1rem; }
.form-group label {
  display: block; font-size: 0.72rem; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.45rem;
}
.form-group input {
  width: 100%; padding: 0.8rem 1rem;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 10px; color: var(--text); font-size: 0.9rem;
  transition: border-color 0.35s, box-shadow 0.35s;
}
.form-group input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  outline: none;
}
.btn-unlock {
  width: 100%; padding: 1rem;
  background: var(--accent); color: var(--bg);
  border: none; border-radius: 100px;
  font-weight: 600; font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.3s;
}
.btn-unlock:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px var(--accent-glow-strong);
}
.btn-unlock:disabled { opacity: 0.6; cursor: not-allowed; }
.field-status { font-size: 0.78rem; margin-top: 0.4rem; display: none; }
.error-msg { color: #ff6b6b; font-size: 0.82rem; margin-bottom: 0.75rem; display: none; }
.gate-privacy { font-size: 0.72rem; color: var(--text-muted); text-align: center; margin-top: 1rem; }
```

---

## Unlock Banner (inside #prompt-content)

```html
<div style="background: linear-gradient(135deg, rgba(0,240,160,0.06), rgba(0,240,160,0.02));
            border: 1px solid rgba(0,240,160,0.2); border-radius: 16px;
            padding: 1.5rem 2rem; margin-bottom: 3rem; text-align: center;">
  <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🎉</div>
  <strong>Prompt unlock ho gaya!</strong><br>
  <span style="color: var(--text-muted);">Copy karo, ChatGPT mein paste karo, aur shuru ho jao.</span>
</div>
```

---

## Prompt Text Block with Copy Button

```html
<div style="position: relative;">
  <div class="prompt-text" id="main-prompt"
       style="background: var(--bg); border: 1px solid var(--border);
              border-radius: 10px; padding: 1.25rem;
              font-family: 'JetBrains Mono', monospace;
              font-size: 0.82rem; line-height: 1.7;
              white-space: pre-wrap; word-break: break-word;">
Your prompt text goes here...
  </div>
  <button onclick="copyPrompt('main-prompt', this)"
          style="position: absolute; top: 1rem; right: 1rem;
                 padding: 0.3rem 0.7rem; font-size: 0.72rem;
                 border: 1px solid var(--border); background: var(--bg-card);
                 color: var(--text-muted); border-radius: 8px; cursor: pointer;">
    📋 Copy
  </button>
</div>
```

---

## Localization Style

All user-facing text uses **Hinglish** (Hindi-English code-switching).  
Tone: casual, friendly, vernacular.

Examples:
- "free hai"
- "turant unlock"
- "daalo"
- "karo"
- "pehle"
- "Yeh email format sahi nahi lag raha"
- "Bohot zyada requests bhej di!"

---

## Pattern B: Dynamic JSON Content

If using external JSON for prompt data:

**JSON structure (`/your-page-data.json`):**
```json
{
  "prompt": {
    "eyebrow": "Series name",
    "title": "Page title",
    "label": "🔥 Section label",
    "heading": "Prompt heading",
    "text": "Full prompt text...",
    "tip": "Usage tip text..."
  },
  "howToUse": {
    "title": "Steps title",
    "steps": [
      { "text": "<strong>Step 1</strong> — description" }
    ]
  },
  "cta": {
    "title": "CTA heading",
    "subtitle": "CTA subtext",
    "buttons": [
      { "text": "Button text", "href": "/path", "style": "primary" }
    ]
  }
}
```

**JS to load and render:**
```javascript
function showPrompt() {
  // ... hide gate ...
  fetch('/your-page-data.json')
    .then(r => r.json())
    .then(data => renderPromptContent(data))
    .catch(err => { /* show error */ });
}
```

---

## Quick Start (copy-paste workflow)

1. Copy `booking-prompt.html` → rename to `your-page.html`
2. Change `<title>`, meta tags, OG tags
3. Replace hero content (badge, h1, subtitle, showcase)
4. Change `formName` to unique value (e.g. `"job_hunter_gate"`)
5. Change sessionStorage key to match (e.g. `"job_hunter_unlocked"`)
6. Replace `#prompt-content` innerHTML with your prompt
7. Add nav link to page
8. Test: fill form → verify unlock → reload → verify session skip
