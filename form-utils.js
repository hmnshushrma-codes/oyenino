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
  // EXPORTS
  // ===========================

  window.OyeNinoForm = OyeNinoForm;
  window.oyeTrackEvent = trackEvent;
  window.oyeCopyPrompt = copyPrompt;
  window.oyeGetDeviceInfo = getDeviceInfo;
  window.oyeGetLocationInfo = getLocationInfo;

})(window);