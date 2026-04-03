/**
 * form-utils.js — Shared validation & form utilities for oyenino.com
 * Used across: index.html, existence/, prompts.html, shopping-prompt.html
 *
 * Features:
 *  - Email validation (format, disposable blocking, typo detection, MX check)
 *  - Phone validation (Indian +91 format)
 *  - Device & location fingerprinting
 *  - Turnstile integration
 *  - Smart button state management
 *  - GA4 event tracking helper
 *
 * Usage:
 *   <script src="/form-utils.js"></script>
 *   <script>
 *     const validator = new OyeNinoForm({
 *       formId: 'gateForm',
 *       emailId: 'gate-email',
 *       phoneId: 'gate-phone',
 *       nameId: 'gate-name',
 *       btnId: 'unlockBtn',
 *       statusId: 'emailStatus',
 *       phoneStatusId: 'phoneStatus',
 *       errorId: 'formError',
 *       formName: 'existence_series',
 *       requiredFields: ['name', 'email', 'phone'],
 *       btnTexts: { ready: '🔓 Prompts Unlock Karo — Free' },
 *       onSuccess: function() { showPrompts(); }
 *     });
 *   </script>
 */

(function (window) {
  "use strict";

  // ===========================
  // CONSTANTS
  // ===========================

  var FORM_API = "https://forms.oyenino.com";

  var DISPOSABLE_DOMAINS = [
    "tempmail.com","temp-mail.org","guerrillamail.com","guerrillamail.de",
    "guerrillamail.net","guerrillamail.org","sharklasers.com","grr.la",
    "guerrilla.ml","yopmail.com","yopmail.fr","mailinator.com",
    "trashmail.com","trashmail.net","throwaway.email","fakeinbox.com",
    "mailnesia.com","maildrop.cc","dispostable.com","getairmail.com",
    "mailcatch.com","tempr.email","discard.email","mailsac.com",
    "10minutemail.com","tempail.com","burpcollaborator.net",
    "temp-mail.io","mohmal.com","getnada.com","emailondeck.com",
    "tmail.ws","tmpmail.net","tmpmail.org","binkmail.com","trashmail.me",
    "guerrillamailblock.com","mailexpire.com","throwam.com",
    "filzmail.com","anonaddy.com","spamgourmet.com","mytemp.email",
    "tempinbox.com","tempmailaddress.com","emailfake.com","crazymailing.com",
    "armyspy.com","dayrep.com","einrot.com","fleckens.hu","gustr.com",
    "jourrapide.com","rhyta.com","superrito.com","teleworm.us"
  ];

  var TYPO_MAP = {
    "gmial.com":"gmail.com","gmal.com":"gmail.com","gmaill.com":"gmail.com",
    "gamil.com":"gmail.com","gnail.com":"gmail.com","gmail.co":"gmail.com",
    "gmail.con":"gmail.com","gmail.om":"gmail.com","gmail.cm":"gmail.com",
    "gmai.com":"gmail.com","gmil.com":"gmail.com","gmail.comm":"gmail.com",
    "gmail.in":"gmail.com","gmail.cim":"gmail.com","gmail.cpm":"gmail.com",
    "gmail.xom":"gmail.com","gmail.vom":"gmail.com","gmaul.com":"gmail.com",
    "gmakl.com":"gmail.com","yaho.com":"yahoo.com","yahooo.com":"yahoo.com",
    "yahoo.co":"yahoo.com","yahoo.con":"yahoo.com","yahoo.om":"yahoo.com",
    "yhaoo.com":"yahoo.com","yaoo.com":"yahoo.com","yahoo.cm":"yahoo.com",
    "yahoo.comm":"yahoo.com","hotmal.com":"hotmail.com","hotmial.com":"hotmail.com",
    "hotmail.con":"hotmail.com","hotmail.co":"hotmail.com","hotmali.com":"hotmail.com",
    "hotmai.com":"hotmail.com","outloo.com":"outlook.com","outlok.com":"outlook.com",
    "outlook.co":"outlook.com","outlook.con":"outlook.com","outllook.com":"outlook.com",
    "outlokk.com":"outlook.com","rediffmal.com":"rediffmail.com",
    "rediffmail.co":"rediffmail.com","redifmail.com":"rediffmail.com",
    "reddiffmail.com":"rediffmail.com","protonmal.com":"protonmail.com",
    "protonmail.co":"protonmail.com","protonmail.con":"protonmail.com",
    "icloud.co":"icloud.com","icloud.con":"icloud.com","icoud.com":"icloud.com"
  };

  // ===========================
  // UTILITY: GA4 TRACKER
  // ===========================

  function trackEvent(eventName, params) {
    if (typeof gtag === "function") gtag("event", eventName, params || {});
  }

  // ===========================
  // EMAIL VALIDATION
  // ===========================

  var mxCache = {};

  function checkMX(domain) {
    return new Promise(function (resolve) {
      if (mxCache[domain] !== undefined) { resolve(mxCache[domain]); return; }
      fetch("https://dns.google/resolve?name=" + encodeURIComponent(domain) + "&type=MX")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var ok = data.Status === 0 && data.Answer && data.Answer.length > 0;
          mxCache[domain] = ok;
          resolve(ok);
        })
        .catch(function () { mxCache[domain] = true; resolve(true); });
    });
  }

  function validateEmailSync(email) {
    email = email.trim().toLowerCase();
    if (!email) return { valid: false, msg: "", type: "" };

    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email))
      return { valid: false, msg: "Yeh email format sahi nahi lag raha", type: "error" };

    var domain = email.split("@")[1];

    if (DISPOSABLE_DOMAINS.indexOf(domain) !== -1)
      return { valid: false, msg: "Temporary/disposable email allowed nahi hai. Apna real email use karo.", type: "error" };

    if (TYPO_MAP[domain]) {
      var fix = email.split("@")[0] + "@" + TYPO_MAP[domain];
      return { valid: false, msg: 'Kya tumhara matlab <strong>' + fix + '</strong> tha?', type: "typo", suggestion: fix };
    }

    if (domain.length < 4)
      return { valid: false, msg: "Yeh domain sahi nahi lagta", type: "error" };

    return { valid: true, msg: "\u2713 Email looks good", type: "success" };
  }

  // ===========================
  // PHONE VALIDATION (INDIAN)
  // ===========================

  function validatePhone(phone) {
    phone = phone.trim();
    if (!phone) return { valid: false, msg: "", type: "" };

    var cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

    var patterns = [
      /^\+91[6-9]\d{9}$/,
      /^91[6-9]\d{9}$/,
      /^0[6-9]\d{9}$/,
      /^[6-9]\d{9}$/
    ];

    if (patterns.some(function (p) { return p.test(cleaned); }))
      return { valid: true, msg: "\u2713 Phone number valid hai", type: "success" };

    if (/^\+?\d{5,}$/.test(cleaned)) {
      if (cleaned.length < 10) return { valid: false, msg: "Phone number chhota hai \u2014 10 digits hone chahiye", type: "error" };
      if (cleaned.length > 13) return { valid: false, msg: "Phone number zyada lamba hai", type: "error" };
      var first = cleaned.replace(/^\+?91/, "").charAt(0);
      if (first && "012345".indexOf(first) !== -1)
        return { valid: false, msg: "Indian mobile numbers 6, 7, 8 ya 9 se start hote hain", type: "error" };
      return { valid: false, msg: "Sahi phone number daalo (+91 XXXXX XXXXX)", type: "error" };
    }

    return { valid: false, msg: "Yeh phone number sahi nahi lag raha", type: "error" };
  }

  function formatPhoneDisplay(phone) {
    var cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    var digits;
    if (cleaned.startsWith("+91")) digits = cleaned.slice(3);
    else if (cleaned.startsWith("91") && cleaned.length === 12) digits = cleaned.slice(2);
    else if (cleaned.startsWith("0")) digits = cleaned.slice(1);
    else digits = cleaned;
    if (digits.length === 10) return "+91 " + digits.slice(0, 5) + " " + digits.slice(5);
    return phone;
  }

  // ===========================
  // DEVICE & LOCATION CAPTURE
  // ===========================

  function getDeviceInfo() {
    var ua = navigator.userAgent;
    var info = {
      user_agent: ua,
      platform: navigator.platform || "unknown",
      language: navigator.language || "unknown",
      screen: screen.width + "x" + screen.height,
      viewport: window.innerWidth + "x" + window.innerHeight,
      pixel_ratio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      connection: (navigator.connection && navigator.connection.effectiveType) || "unknown",
      referrer: document.referrer || "direct",
      page: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Device type
    if (/Mobile|Android|iPhone|iPad/i.test(ua))
      info.device_type = /iPad|tablet/i.test(ua) ? "tablet" : "mobile";
    else info.device_type = "desktop";

    // Browser
    if (/Edg\//i.test(ua)) info.browser = "Edge";
    else if (/OPR\/|Opera/i.test(ua)) info.browser = "Opera";
    else if (/Chrome\//i.test(ua)) info.browser = "Chrome";
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) info.browser = "Safari";
    else if (/Firefox\//i.test(ua)) info.browser = "Firefox";
    else info.browser = "Other";

    // OS
    if (/Windows/i.test(ua)) info.os = "Windows";
    else if (/Mac OS/i.test(ua)) info.os = "macOS";
    else if (/Android/i.test(ua)) info.os = "Android";
    else if (/iOS|iPhone|iPad/i.test(ua)) info.os = "iOS";
    else if (/Linux/i.test(ua)) info.os = "Linux";
    else info.os = "Other";

    return info;
  }

  function getLocationInfo() {
    return new Promise(function (resolve) {
      fetch("https://ipapi.co/json/")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && !d.error) resolve({
            ip: d.ip || "", city: d.city || "", region: d.region || "",
            country: d.country_name || "", country_code: d.country_code || "",
            lat: d.latitude || "", lon: d.longitude || "",
            timezone: d.timezone || "", org: d.org || "", postal: d.postal || ""
          });
          else resolve(null);
        })
        .catch(function () { resolve(null); });
    });
  }

  // ===========================
  // MAIN FORM CLASS
  // ===========================

  function OyeNinoForm(cfg) {
    var self = this;
    this.cfg = cfg;

    // State
    this.emailValid = false;
    this.phoneValid = !cfg.phoneId; // no phone field = always valid
    this.turnstileVerified = false;
    this.locationData = null;
    this.deviceData = getDeviceInfo();

    // DOM
    this.form = document.getElementById(cfg.formId);
    this.emailInput = document.getElementById(cfg.emailId);
    this.btn = document.getElementById(cfg.btnId);
    this.emailStatus = document.getElementById(cfg.statusId);
    this.errorEl = document.getElementById(cfg.errorId);
    this.phoneInput = cfg.phoneId ? document.getElementById(cfg.phoneId) : null;
    this.phoneStatus = cfg.phoneStatusId ? document.getElementById(cfg.phoneStatusId) : null;
    this.nameInput = cfg.nameId ? document.getElementById(cfg.nameId) : null;

    this.required = cfg.requiredFields || ["name", "email"];

    this.txt = {
      ready: "\uD83D\uDD13 Submit",
      turnstile: "Verify you're human first \u2191",
      email: "Valid email daalo pehle",
      phone: "Valid phone number daalo",
      fields: "Sab fields fill karo",
      submitting: "\u23F3 Submitting..."
    };
    if (cfg.btnTexts) for (var k in cfg.btnTexts) this.txt[k] = cfg.btnTexts[k];

    // Init everything
    this._initEmail();
    if (cfg.phoneId) this._initPhone();
    this._initFieldListeners();
    this._initSubmit();
    this._fetchLocation();

    // Turnstile global callbacks
    window.onTurnstileSuccess = function (token) {
      self.turnstileVerified = true;
      self._updateBtn();
      trackEvent("turnstile_verified", { form_id: cfg.formName });
    };
    window.onTurnstileExpired = function () {
      self.turnstileVerified = false;
      self._updateBtn();
    };
  }

  // ---- EMAIL ----
  OyeNinoForm.prototype._initEmail = function () {
    var self = this, mxT;

    this.emailInput.addEventListener("input", function () {
      var val = this.value.trim();
      clearTimeout(mxT);

      if (!val) {
        self.emailValid = false;
        self._stat(self.emailStatus, "", "");
        self._updateBtn();
        return;
      }

      var r = validateEmailSync(val);
      if (!r.valid) {
        self.emailValid = false;
        var h = r.msg;
        if (r.type === "typo" && r.suggestion)
          h += ' <button type="button" class="typo-fix-btn" data-fix="' + r.suggestion + '">Fix it</button>';
        self._stat(self.emailStatus, h, "email-" + r.type);
        self._updateBtn();
        return;
      }

      self.emailValid = false;
      self._stat(self.emailStatus, '<span class="email-checking">\u23F3 Domain verify ho raha hai...</span>', "email-pending");
      self._updateBtn();

      mxT = setTimeout(function () {
        var domain = val.toLowerCase().split("@")[1];
        checkMX(domain).then(function (ok) {
          if (self.emailInput.value.trim().toLowerCase() !== val.toLowerCase()) return;
          self.emailValid = ok;
          self._stat(self.emailStatus,
            ok ? "\u2713 Email verified" : "Yeh email domain exist nahi karta. Real email use karo.",
            ok ? "email-success" : "email-error");
          trackEvent(ok ? "email_mx_verified" : "email_mx_failed", { domain: domain });
          self._updateBtn();
        });
      }, 600);
    });

    this.emailInput.addEventListener("blur", function () {
      if (this.value.trim()) this.dispatchEvent(new Event("input"));
    });

    if (this.emailStatus) {
      this.emailStatus.addEventListener("click", function (e) {
        if (e.target.classList.contains("typo-fix-btn")) {
          var fix = e.target.getAttribute("data-fix");
          self.emailInput.value = fix;
          self.emailInput.dispatchEvent(new Event("input"));
          self.emailInput.focus();
          trackEvent("email_typo_fixed", { corrected_to: fix.split("@")[1] });
        }
      });
    }
  };

  // ---- PHONE ----
  OyeNinoForm.prototype._initPhone = function () {
    var self = this;

    this.phoneInput.addEventListener("input", function () {
      var val = this.value.trim();
      if (!val) {
        self.phoneValid = false;
        self._stat(self.phoneStatus, "", "");
        self._updateBtn();
        return;
      }
      var r = validatePhone(val);
      self.phoneValid = r.valid;
      self._stat(self.phoneStatus, r.msg, r.msg ? ("phone-" + r.type) : "");
      self._updateBtn();
    });

    this.phoneInput.addEventListener("blur", function () {
      if (this.value.trim()) {
        var r = validatePhone(this.value.trim());
        if (r.valid) this.value = formatPhoneDisplay(this.value.trim());
        this.dispatchEvent(new Event("input"));
      }
    });
  };

  // ---- FIELD LISTENERS ----
  OyeNinoForm.prototype._initFieldListeners = function () {
    var self = this;
    this.form.querySelectorAll("input, textarea, select").forEach(function (el) {
      el.addEventListener("input", function () { self._updateBtn(); });
    });
  };

  // ---- BUTTON STATE ----
  OyeNinoForm.prototype._updateBtn = function () {
    var filled = this._fieldsFilled();

    if (filled && this.emailValid && this.phoneValid && this.turnstileVerified) {
      this.btn.disabled = false;
      this.btn.innerHTML = this.txt.ready;
    } else if (filled && this.emailValid && this.phoneValid && !this.turnstileVerified) {
      this.btn.disabled = true;
      this.btn.innerHTML = this.txt.turnstile;
    } else if (!this.emailValid && this.emailInput.value.trim()) {
      this.btn.disabled = true;
      this.btn.innerHTML = this.txt.email;
    } else if (this.phoneInput && !this.phoneValid && this.phoneInput.value.trim()) {
      this.btn.disabled = true;
      this.btn.innerHTML = this.txt.phone;
    } else {
      this.btn.disabled = true;
      this.btn.innerHTML = this.txt.fields;
    }
  };

  OyeNinoForm.prototype._fieldsFilled = function () {
    var self = this;
    return this.required.every(function (f) {
      if (f === "name") return self.nameInput && self.nameInput.value.trim().length > 0;
      if (f === "email") return self.emailInput.value.trim().length > 0;
      if (f === "phone") return self.phoneInput && self.phoneInput.value.trim().length > 0;
      // Generic: look up by name or id
      var el = self.form.querySelector('[name="' + f + '"]') || document.getElementById(f);
      return el && el.value && el.value.trim().length > 0;
    });
  };

  // ---- STATUS DISPLAY ----
  OyeNinoForm.prototype._stat = function (el, html, cls) {
    if (!el) return;
    el.innerHTML = html;
    el.className = "field-status";
    if (cls) el.classList.add(cls);
    el.style.display = html ? "block" : "none";
  };

  // ---- LOCATION ----
  OyeNinoForm.prototype._fetchLocation = function () {
    var self = this;
    getLocationInfo().then(function (d) {
      self.locationData = d;
      if (d) {
        var city = self.form.querySelector('[name="city"]') || document.getElementById("city");
        if (city && !city.value && d.city && d.country) city.value = d.city + ", " + d.country;
      }
    });
  };

  // ---- FORM SUBMIT (FIXED: proper error handling for backend 422/403) ----
  OyeNinoForm.prototype._initSubmit = function () {
    var self = this;

    this.form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!self._fieldsFilled()) { self._err("Sab fields fill karo please."); return; }
      if (!self.emailValid) { self._err("Pehle valid email daalo."); return; }
      if (self.phoneInput && !self.phoneValid) { self._err("Pehle valid phone number daalo."); return; }
      if (!self.turnstileVerified) { self._err("Human verification complete karo."); return; }

      self._errHide();
      self.btn.disabled = true;
      self.btn.innerHTML = self.txt.submitting;

      // Build payload
      var payload = {
        _form_name: self.cfg.formName,
        source: self.cfg.source || window.location.pathname,
        turnstile_token: (self.form.querySelector('[name="cf-turnstile-response"]') || {}).value || ""
      };

      // All form fields
      new FormData(self.form).forEach(function (v, k) {
        if (k !== "cf-turnstile-response" && k !== "_form_name") payload[k] = v;
      });

      // Formatted phone
      if (payload.phone) payload.phone_formatted = formatPhoneDisplay(payload.phone);

      // Device + location
      payload.device = self.deviceData;
      if (self.locationData) payload.location = self.locationData;

      trackEvent(self.cfg.formName + "_submit", {
        has_name: !!payload.name, has_phone: !!payload.phone,
        device_type: self.deviceData.device_type, browser: self.deviceData.browser
      });

      fetch(FORM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          // Parse JSON body regardless of status code
          return res.json().then(function (body) {
            return { ok: res.ok, status: res.status, body: body };
          }).catch(function () {
            // If JSON parsing fails, treat as success if status was ok
            return { ok: res.ok, status: res.status, body: null };
          });
        })
        .then(function (result) {
          if (result.ok) {
            // ===== REAL SUCCESS =====
            trackEvent(self.cfg.formName + "_success", { visitor_name: payload.name || "" });
            if (self.cfg.onSuccess) self.cfg.onSuccess(payload);
          } else {
            // ===== SERVER REJECTED =====
            var errMsg = "Something went wrong. Please try again.";
            var errBody = result.body;

            if (errBody && errBody.error) {
              // Map backend errors to user-friendly Hindi-English messages
              if (result.status === 422) {
                // Email validation failed on server
                errMsg = errBody.detail || "Yeh email valid nahi hai. Apna real email use karo.";
                // Mark email as invalid so button stays disabled
                self.emailValid = false;
                self._stat(self.emailStatus, "⚠ " + errMsg, "email-error");
                // Focus the email field so user knows what to fix
                self.emailInput.focus();
                trackEvent("email_server_rejected", {
                  email_domain: payload.email ? payload.email.split("@")[1] : "",
                  reason: errBody.detail || errBody.error
                });
              } else if (result.status === 403) {
                errMsg = errBody.detail || "Bot verification failed. Page refresh karo aur try karo.";
                // Reset turnstile state
                self.turnstileVerified = false;
                if (typeof turnstile !== "undefined") turnstile.reset();
                trackEvent("turnstile_server_rejected", { reason: errBody.detail || errBody.error });
              } else if (result.status === 429) {
                errMsg = "Bohot zyada requests bhej di! Thoda wait karo aur try karo.";
                trackEvent("rate_limited", { form: self.cfg.formName });
              } else {
                errMsg = errBody.detail || errBody.error || errMsg;
              }
            }

            self._err(errMsg);
            trackEvent(self.cfg.formName + "_error", { status: result.status, error: errMsg });
          }
        })
        .catch(function (networkErr) {
          // ===== NETWORK ERROR (no internet, DNS fail, etc.) =====
          self._err("Network error. Internet connection check karo aur try karo.");
          trackEvent(self.cfg.formName + "_network_error", { error: networkErr.message || "unknown" });
        })
        .finally(function () {
          // Always re-enable button so user can retry
          self.btn.disabled = false;
          self._updateBtn();
        });
    });
  };

  OyeNinoForm.prototype._err = function (msg) {
    if (this.errorEl) { this.errorEl.textContent = msg; this.errorEl.classList.add("show"); }
  };
  OyeNinoForm.prototype._errHide = function () {
    if (this.errorEl) this.errorEl.classList.remove("show");
  };

  // ===========================
  // INJECT SHARED CSS
  // ===========================

  function injectCSS() {
    if (document.getElementById("oye-form-css")) return;
    var s = document.createElement("style");
    s.id = "oye-form-css";
    s.textContent =
      ".field-status{font-size:.78rem;margin-top:.4rem;display:none;padding:.3rem 0;transition:all .2s}" +
      ".field-status.email-success,.field-status.phone-success{color:var(--accent,#00f0a0)}" +
      ".field-status.email-error,.field-status.phone-error{color:#ff6b6b}" +
      ".field-status.email-typo{color:#FFD93D}" +
      ".field-status.email-pending{color:var(--text-muted,#706c66)}" +
      ".email-checking{display:inline-flex;align-items:center;gap:.3rem;animation:oyePulse 1.5s ease-in-out infinite}" +
      "@keyframes oyePulse{0%,100%{opacity:1}50%{opacity:.5}}" +
      ".typo-fix-btn{background:rgba(255,217,61,.15);border:1px solid rgba(255,217,61,.3);color:#FFD93D;font-family:var(--sans,system-ui);font-size:.72rem;font-weight:600;padding:.2rem .6rem;border-radius:4px;cursor:pointer;margin-left:.3rem;transition:all .2s}" +
      ".typo-fix-btn:hover{background:rgba(255,217,61,.25);border-color:#FFD93D}" +
      ".error-msg{color:#ff6b6b;font-size:.8rem;margin-bottom:.5rem;display:none}" +
      ".error-msg.show{display:block}";
    document.head.appendChild(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectCSS);
  else injectCSS();

  // ===========================
  // COPY PROMPT UTILITY
  // ===========================

  function copyPrompt(id, btn) {
    var text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = "\u2713 Copied!";
      btn.classList.add("copied");
      trackEvent("prompt_copied", { prompt_id: id, page: window.location.pathname });
      setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
    });
  }

  // ===========================
  // CREATE GATE (reusable form-gate for prompt pages)
  // ===========================

  var COUNTRY_CODES = [
    {v:"+91",f:"\uD83C\uDDEE\uD83C\uDDF3 +91"},{v:"+1",f:"\uD83C\uDDFA\uD83C\uDDF8 +1"},{v:"+44",f:"\uD83C\uDDEC\uD83C\uDDE7 +44"},
    {v:"+971",f:"\uD83C\uDDE6\uD83C\uDDEA +971"},{v:"+61",f:"\uD83C\uDDE6\uD83C\uDDFA +61"},{v:"+49",f:"\uD83C\uDDE9\uD83C\uDDEA +49"},
    {v:"+33",f:"\uD83C\uDDEB\uD83C\uDDF7 +33"},{v:"+81",f:"\uD83C\uDDEF\uD83C\uDDF5 +81"},{v:"+65",f:"\uD83C\uDDF8\uD83C\uDDEC +65"},
    {v:"+966",f:"\uD83C\uDDF8\uD83C\uDDE6 +966"},{v:"+974",f:"\uD83C\uDDF6\uD83C\uDDE6 +974"},{v:"+968",f:"\uD83C\uDDF4\uD83C\uDDF2 +968"},
    {v:"+977",f:"\uD83C\uDDF3\uD83C\uDDF5 +977"},{v:"+880",f:"\uD83C\uDDE7\uD83C\uDDE9 +880"},{v:"+94",f:"\uD83C\uDDF1\uD83C\uDDF0 +94"},
    {v:"+60",f:"\uD83C\uDDF2\uD83C\uDDFE +60"},{v:"+86",f:"\uD83C\uDDE8\uD83C\uDDF3 +86"},{v:"+82",f:"\uD83C\uDDF0\uD83C\uDDF7 +82"},
    {v:"+234",f:"\uD83C\uDDF3\uD83C\uDDEC +234"},{v:"+254",f:"\uD83C\uDDF0\uD83C\uDDEA +254"},{v:"+27",f:"\uD83C\uDDFF\uD83C\uDDE6 +27"},
    {v:"+55",f:"\uD83C\uDDE7\uD83C\uDDF7 +55"},{v:"+52",f:"\uD83C\uDDF2\uD83C\uDDFD +52"},{v:"+92",f:"\uD83C\uDDF5\uD83C\uDDF0 +92"},
    {v:"+62",f:"\uD83C\uDDEE\uD83C\uDDE9 +62"},{v:"+66",f:"\uD83C\uDDF9\uD83C\uDDED +66"},{v:"+84",f:"\uD83C\uDDFB\uD83C\uDDF3 +84"},
    {v:"+63",f:"\uD83C\uDDF5\uD83C\uDDED +63"},{v:"+7",f:"\uD83C\uDDF7\uD83C\uDDFA +7"},{v:"+39",f:"\uD83C\uDDEE\uD83C\uDDF9 +39"},
    {v:"+34",f:"\uD83C\uDDEA\uD83C\uDDF8 +34"},{v:"+31",f:"\uD83C\uDDF3\uD83C\uDDF1 +31"},{v:"+46",f:"\uD83C\uDDF8\uD83C\uDDEA +46"},
    {v:"+41",f:"\uD83C\uDDE8\uD83C\uDDED +41"},{v:"+48",f:"\uD83C\uDDF5\uD83C\uDDF1 +48"}
  ];

  function injectGateCSS() {
    if (document.getElementById("oye-gate-css")) return;
    var s = document.createElement("style");
    s.id = "oye-gate-css";
    s.textContent =
      ".oye-gate-wrap{max-width:600px;margin:0 auto;padding:0 2rem 4rem}" +
      ".oye-gate-card{background:var(--bg-card,#111);border:1px solid var(--border,#1a1a1a);border-radius:var(--radius,16px);padding:3rem 2.5rem;position:relative;overflow:hidden}" +
      ".oye-gate-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent,#00f0a0),#f59e0b 60%,transparent 90%)}" +
      ".oye-gate-title{font-family:var(--serif,'Playfair Display',Georgia,serif);font-size:1.75rem;font-weight:400;margin-bottom:.5rem;text-align:center}" +
      ".oye-gate-sub{color:var(--text-muted,#706c66);font-size:.9rem;text-align:center;margin-bottom:2rem;font-weight:300}" +
      ".oye-gate-teaser{list-style:none;padding:0;margin:0 0 1.5rem}" +
      ".oye-gate-teaser li{font-size:.85rem;color:var(--text-mid,#b5b0a8);line-height:1.75;font-weight:300;padding-left:1.2rem;position:relative}" +
      ".oye-gate-teaser li::before{content:'\u2192';color:var(--accent,#00f0a0);position:absolute;left:0;font-weight:600}" +
      ".oye-gate .form-group{margin-bottom:1.2rem}" +
      ".oye-gate .form-group label{display:block;font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted,#706c66);margin-bottom:.4rem;font-weight:500}" +
      ".oye-gate .form-group input,.oye-gate .form-group select{width:100%;padding:.85rem 1rem;background:var(--bg,#050505);border:1px solid var(--border,#1a1a1a);border-radius:10px;color:var(--text,#eeeae4);font-family:var(--sans,'Outfit',system-ui,sans-serif);font-size:.9rem;outline:none;transition:border-color .35s,box-shadow .35s}" +
      ".oye-gate .form-group input:focus,.oye-gate .form-group select:focus{border-color:var(--accent,#00f0a0);box-shadow:0 0 0 3px rgba(0,240,160,.1)}" +
      ".oye-gate .form-group input::placeholder{color:#444}" +
      ".oye-gate .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}" +
      ".oye-gate .phone-row{display:flex;gap:.5rem}" +
      ".oye-gate .phone-row select{width:110px;flex-shrink:0;font-size:.8rem;padding:.85rem .5rem;background:var(--bg,#050505);border:1px solid var(--border,#1a1a1a);border-radius:10px;color:var(--text,#eeeae4);cursor:pointer}" +
      ".oye-gate .phone-row select option{background:var(--bg,#050505);color:var(--text,#eeeae4)}" +
      ".oye-gate .phone-row input{flex:1}" +
      ".oye-gate-btn{width:100%;padding:1rem;background:var(--accent,#00f0a0);color:var(--bg,#050505);border:none;border-radius:100px;font-family:var(--sans,'Outfit',system-ui,sans-serif);font-size:1rem;font-weight:600;cursor:pointer;transition:transform .2s,box-shadow .3s;margin-top:.5rem;position:relative;overflow:hidden}" +
      ".oye-gate-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,240,160,.2)}" +
      ".oye-gate-btn:disabled{opacity:.5;cursor:not-allowed}" +
      ".oye-gate-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transform:translateX(-100%);transition:transform .6s}" +
      ".oye-gate-btn:hover:not(:disabled)::after{transform:translateX(100%)}" +
      ".oye-gate-note{text-align:center;color:var(--text-muted,#706c66);font-size:.75rem;margin-top:1rem;font-weight:300}" +
      ".oye-gate-success{text-align:center;padding:2.5rem 1.5rem;display:none}" +
      ".oye-gate-success .checkmark{width:56px;height:56px;border-radius:50%;background:rgba(0,240,160,.1);border:2px solid var(--accent,#00f0a0);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;font-size:1.5rem;color:var(--accent,#00f0a0)}" +
      ".oye-gate-success h3{font-family:var(--serif,'Playfair Display',Georgia,serif);font-size:1.5rem;margin-bottom:.5rem}" +
      ".oye-gate-success p{color:var(--text-muted,#706c66);font-weight:300;font-size:.9rem}" +
      "@media(max-width:768px){.oye-gate-card{padding:2rem 1.5rem}.oye-gate .form-row{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  /**
   * OyeNinoForm.createGate — renders a complete form-gate and wires up validation + unlock.
   *
   * @param {string} selector  CSS selector for the container element (e.g. '#gate')
   * @param {Object} opts
   *   formName      {string}   Form name for backend + analytics
   *   title         {string}   Gate card heading
   *   subtitle      {string}   Gate card subheading
   *   teasers       {string[]} Bullet points shown above the form (optional)
   *   fields        {string[]} Base fields: 'name','email','phone' (default: ['name','email','phone'])
   *   countryCode   {boolean}  Show country code dropdown for phone (default: false)
   *   extraFields   {Array}    Additional fields: [{id,name,label,placeholder,type}]
   *   layout        {string}   'stacked' (default) or 'grid' (two-column form-row)
   *   storageKey    {string}   Key for remembering unlock state
   *   storage       {string}   'sessionStorage' (default) or 'localStorage'
   *   contentId     {string}   ID of the element to show after unlock
   *   contentClass  {string}   Class to add to content element on unlock (default: 'unlocked')
   *   btnText       {string}   Button text when ready (default: unlock emoji + text)
   *   successIcon   {string}   Emoji for success checkmark (default: none, hides gate immediately)
   *   successTitle  {string}   Success heading
   *   successMsg    {string}   Success subtext
   *   onUnlock      {function} Extra callback after unlock
   *   source        {string}   Source identifier for analytics
   */
  OyeNinoForm.createGate = function (selector, opts) {
    var container = document.querySelector(selector);
    if (!container) return;

    injectGateCSS();

    opts = opts || {};
    var formName = opts.formName || "prompt_gate";
    var fields = opts.fields || ["name", "email", "phone"];
    var extraFields = opts.extraFields || [];
    var layout = opts.layout || "stacked";
    var storageKey = opts.storageKey || formName + "_unlocked";
    var storageType = opts.storage === "localStorage" ? localStorage : sessionStorage;
    var contentId = opts.contentId || "prompt-content";
    var contentClass = opts.contentClass || "unlocked";
    var showCountryCode = opts.countryCode || false;
    var successIcon = opts.successIcon || null;
    var successTitle = opts.successTitle || "Unlocked!";
    var successMsg = opts.successMsg || "Neeche scroll karo \u2014 sab tumhara hai.";
    var btnReady = opts.btnText || "\uD83D\uDD13 Prompt Unlock Karo \u2014 Free";

    // Unique IDs to avoid collisions
    var uid = "og-" + formName.replace(/[^a-z0-9]/gi, "");
    var ids = {
      form: uid + "-form",
      name: uid + "-name",
      email: uid + "-email",
      phone: uid + "-phone",
      emailSt: uid + "-emailSt",
      phoneSt: uid + "-phoneSt",
      btn: uid + "-btn",
      err: uid + "-err",
      cc: uid + "-cc",
      success: uid + "-success"
    };

    // Build form fields HTML
    var fieldsHTML = "";

    function fieldGroup(id, name, label, placeholder, type) {
      type = type || "text";
      var ac = name === "email" ? ' autocomplete="email"' : name === "phone" ? ' autocomplete="tel"' : name === "name" ? ' autocomplete="name"' : "";
      var statusDiv = name === "email" ? '<div class="field-status" id="' + ids.emailSt + '"></div>' :
                      name === "phone" ? '<div class="field-status" id="' + ids.phoneSt + '"></div>' : "";
      var inputType = name === "email" ? "email" : name === "phone" ? "tel" : type;

      // Phone with country code
      if (name === "phone" && showCountryCode) {
        var ccOpts = "";
        COUNTRY_CODES.forEach(function (c) { ccOpts += '<option value="' + c.v + '">' + c.f + "</option>"; });
        return '<div class="form-group"><label for="' + id + '">' + label + '</label>' +
          '<div class="phone-row"><select id="' + ids.cc + '" name="country_code">' + ccOpts + '</select>' +
          '<input type="tel" id="' + id + '" name="' + name + '" placeholder="' + placeholder + '" required' + ac + '/></div>' +
          statusDiv + '</div>';
      }

      return '<div class="form-group"><label for="' + id + '">' + label + '</label>' +
        '<input type="' + inputType + '" id="' + id + '" name="' + name + '" placeholder="' + placeholder + '" required' + ac + '/>' +
        statusDiv + '</div>';
    }

    // Default field configs
    var defaultFields = {
      name: { label: "Tumhara Naam *", placeholder: "Rahul Sharma" },
      email: { label: "Email Address *", placeholder: "rahul@gmail.com" },
      phone: { label: "Phone Number *", placeholder: showCountryCode ? "98765 43210" : "+91 98765 43210" }
    };

    // Collect all fields in order
    var allFields = [];
    fields.forEach(function (f) {
      var cfg = defaultFields[f];
      if (cfg) allFields.push({ id: ids[f], name: f, label: cfg.label, placeholder: cfg.placeholder });
    });
    extraFields.forEach(function (ef) {
      allFields.push({ id: uid + "-" + ef.id, name: ef.name || ef.id, label: ef.label, placeholder: ef.placeholder || "", type: ef.type || "text" });
    });

    if (layout === "grid") {
      // Render in pairs using form-row
      for (var i = 0; i < allFields.length; i += 2) {
        var a = allFields[i];
        var b = allFields[i + 1];
        if (b) {
          fieldsHTML += '<div class="form-row">' +
            fieldGroup(a.id, a.name, a.label, a.placeholder, a.type) +
            fieldGroup(b.id, b.name, b.label, b.placeholder, b.type) +
            '</div>';
        } else {
          fieldsHTML += fieldGroup(a.id, a.name, a.label, a.placeholder, a.type);
        }
      }
    } else {
      allFields.forEach(function (f) {
        fieldsHTML += fieldGroup(f.id, f.name, f.label, f.placeholder, f.type);
      });
    }

    // Teasers
    var teaserHTML = "";
    if (opts.teasers && opts.teasers.length) {
      teaserHTML = '<ul class="oye-gate-teaser">';
      opts.teasers.forEach(function (t) { teaserHTML += "<li>" + t + "</li>"; });
      teaserHTML += "</ul>";
    }

    // Success block
    var successHTML = "";
    if (successIcon) {
      successHTML = '<div class="oye-gate-success" id="' + ids.success + '">' +
        '<div class="checkmark">' + successIcon + '</div>' +
        '<h3>' + successTitle + '</h3><p>' + successMsg + '</p></div>';
    }

    // Assemble gate HTML
    container.className = (container.className ? container.className + " " : "") + "oye-gate-wrap oye-gate";
    container.innerHTML =
      '<div class="oye-gate-card">' +
        '<div class="oye-gate-title">' + (opts.title || "Prompt unlock karo \u2014 free hai") + '</div>' +
        '<div class="oye-gate-sub">' + (opts.subtitle || 'Apna naam aur email daalo, prompt turant milega. <strong>No spam, promise.</strong>') + '</div>' +
        teaserHTML +
        '<form id="' + ids.form + '" novalidate>' +
          '<input type="hidden" name="_form_name" value="' + formName + '"/>' +
          fieldsHTML +
          '<div class="cf-turnstile" data-sitekey="0x4AAAAAACgSvRvZpT5d_Ab5" data-theme="dark" data-callback="onTurnstileSuccess" data-expired-callback="onTurnstileExpired" style="margin-bottom:1rem;display:flex;justify-content:center"></div>' +
          '<div class="error-msg" id="' + ids.err + '"></div>' +
          '<button type="submit" class="oye-gate-btn" id="' + ids.btn + '" disabled>Sab fields fill karo</button>' +
          '<p class="oye-gate-note">\uD83D\uDD12 Your info safe hai. Kabhi bhi unsubscribe kar sakte ho.</p>' +
        '</form>' +
        successHTML +
      '</div>';

    // Country code prepend on submit
    if (showCountryCode) {
      var form = document.getElementById(ids.form);
      form.addEventListener("submit", function () {
        var ccEl = document.getElementById(ids.cc);
        var phEl = document.getElementById(ids.phone);
        if (ccEl && phEl) {
          var ph = phEl.value.trim();
          if (ph && !ph.startsWith("+")) phEl.value = ccEl.value + ph.replace(/^0/, "");
        }
      });
    }

    // Unlock function
    function doUnlock() {
      storageType.setItem(storageKey, "true");
      trackEvent(formName + "_unlocked");

      container.style.transition = "opacity .4s ease, transform .4s ease";
      container.style.opacity = "0";
      container.style.transform = "translateY(-10px)";
      setTimeout(function () {
        container.style.display = "none";
        var content = document.getElementById(contentId);
        if (content) {
          content.classList.add(contentClass);
          content.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (opts.onUnlock) opts.onUnlock();
      }, 400);
    }

    // Check if already unlocked
    if (storageType.getItem(storageKey) === "true") {
      container.style.display = "none";
      var content = document.getElementById(contentId);
      if (content) content.classList.add(contentClass);
      if (opts.onUnlock) opts.onUnlock();
      return;
    }

    // Render Turnstile if script is loaded
    if (typeof turnstile !== "undefined") {
      turnstile.render(container.querySelector(".cf-turnstile"));
    }

    // Build requiredFields list
    var reqFields = fields.slice();
    extraFields.forEach(function (ef) { reqFields.push(ef.name || ef.id); });

    // Init OyeNinoForm
    try {
      new OyeNinoForm({
        formId: ids.form,
        emailId: ids.email,
        phoneId: fields.indexOf("phone") !== -1 ? ids.phone : null,
        nameId: fields.indexOf("name") !== -1 ? ids.name : null,
        btnId: ids.btn,
        statusId: ids.emailSt,
        phoneStatusId: fields.indexOf("phone") !== -1 ? ids.phoneSt : null,
        errorId: ids.err,
        formName: formName,
        source: opts.source || window.location.pathname,
        requiredFields: reqFields,
        btnTexts: {
          ready: btnReady,
          turnstile: "Verify you're human first \u2191",
          email: "Valid email daalo pehle",
          phone: "Valid phone number daalo",
          fields: "Sab fields fill karo",
          submitting: "\u23F3 Submitting..."
        },
        onSuccess: function () {
          if (successIcon) {
            document.getElementById(ids.form).style.display = "none";
            document.getElementById(ids.success).style.display = "block";
            setTimeout(doUnlock, 1500);
          } else {
            doUnlock();
          }
        }
      });
    } catch (err) {
      // Fallback: just unlock on submit
      console.warn("OyeNinoForm.createGate fallback:", err);
      var btn = document.getElementById(ids.btn);
      btn.disabled = false;
      btn.innerHTML = btnReady;
      document.getElementById(ids.form).addEventListener("submit", function (e) {
        e.preventDefault();
        doUnlock();
      });
    }
  };

  // ===========================
  // EXPORTS
  // ===========================

  window.OyeNinoForm = OyeNinoForm;
  window.oyeTrackEvent = trackEvent;
  window.oyeCopyPrompt = copyPrompt;
  window.oyeGetDeviceInfo = getDeviceInfo;
  window.oyeGetLocationInfo = getLocationInfo;

})(window);