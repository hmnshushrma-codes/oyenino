# Home Server Starter Pack: live testing checklist

Run this after the `starter-pack` branch is merged and deployed. Local tests cannot cover these, because Turnstile and `forms.oyenino.com` only accept the real domain, and in-app browsers only exist on phones.

Use a real email you control. Write down the time of each submission so you can find it in the dashboard.

## 1. Real submission (desktop browser)

- [ ] Open `https://oyenino.com/starter-pack.html?utm_source=test&utm_campaign=livecheck`.
- [ ] The Turnstile widget appears and passes.
- [ ] Submit with name and email, and leave the phone **empty**. The pack opens on the Beginner guide.
- [ ] In the admin dashboard (`admin.oyenino.com`), the lead appears with form name `starter_pack_gate`, your name and email, and an empty phone.
- [ ] The notification email arrives in your inbox.
- [ ] Reload the page. It opens straight to the pack without the form.
- [ ] In GA4 Realtime (or DebugView), you see `starter_pack_gate_success`, `starter_pack_unlock` and `starter_pack_tab_view`. Open each event's parameters and confirm **no name, email or phone** appears anywhere.
- [ ] Submit once more in a private window with an invalid phone such as `12`. The form shows "Check your phone number, or leave it empty." and nothing is sent. Then fix it to a valid number and submit. The dashboard shows the formatted phone.
- [ ] Open one older gated page (for example `sql-cheat-sheet.html`), submit, and check it still unlocks and appears in the dashboard. This confirms the `form-utils.js` change did not break other pages.

## 2. Android phone (Chrome)

- [ ] Open the page in Chrome. Submit the form. The pack opens.
- [ ] Tap through all four tabs.
- [ ] Tap a Copy button on a prompt and paste it into a notes app. It pastes the full prompt, with the [brackets] as plain text.
- [ ] Tap a "P7" link in the Tech guide. It opens the prompt library at P7. The back button returns to the Tech guide.
- [ ] Wide tables scroll sideways inside their box and the page itself does not move sideways.

## 3. iPhone (Safari)

- [ ] Same steps as Android.
- [ ] If Copy shows "Press and hold to copy", the text should already be selected. Press and hold, then choose Copy.

## 4. Instagram in-app browser (both phones)

Send yourself the link from another account, as a **story link sticker** or in a **direct message**, then tap it inside the Instagram app. Do this on Android and on iPhone.

- [ ] The page opens inside Instagram, not in the phone's browser.
- [ ] Turnstile passes, and the form submits.
- [ ] The pack opens, and the tabs work.
- [ ] **Copy:** tap Copy on a code block and on a prompt. Note whether it says "Copied" or "Press and hold to copy". Paste somewhere to confirm.
- [ ] Close the in-app browser, tap the link again from Instagram. Note whether the pack is still unlocked. Instagram may clear storage, which means the form shows again. That is expected, but write down what happens.
- [ ] Use the in-app menu to "Open in browser" (Chrome or Safari). The form shows again there, because storage is per browser. The page should say this in the unlock banner.
- [ ] The lead appears in the admin dashboard with `utm_source` in GA, if you used a UTM link.

## 5. Accessibility spot check

- [ ] Turn on VoiceOver (iPhone) or TalkBack (Android). The form fields are read with their labels. "Phone number (optional)" is announced.
- [ ] The tabs are announced as tabs, with "selected" on the current one.
- [ ] After tapping Copy, "Copied to clipboard" or "Press and hold to copy" is announced.

## Record the results

| Check | Android Chrome | iPhone Safari | Instagram Android | Instagram iPhone |
| --- | --- | --- | --- | --- |
| Form submits | | | | |
| Pack opens | | | | |
| Copy works | | | | |
| Stays unlocked after reopening | | | | |
| P links | | | | |

---

## PR description (draft)

**Home Server Starter Pack page, plus GA privacy fixes**

- Adds `starter-pack.html`: a gated page that follows `guide.md` and the SQL cheat sheet pattern. It uses the same backend (`forms.oyenino.com`) and fields, and the phone is optional.
- Content comes from `content/starter-pack/*.md`, built into `starter-pack-content.js` by `scripts/build-starter-pack-content.mjs`. The content file is loaded only after unlock.
- Adds `starter-pack-render.js`, a small Markdown renderer that escapes all HTML first, with tabs, Copy buttons, placeholder highlighting and the P1 to P16 index.
- **Privacy fix on all gated pages:** `form-utils.js` and `veyra/index.html` no longer send the visitor's name to GA4.
- `scripts/check-starter-pack.js` checks the content and the renderer, and fails if any GA event on the site includes personal data.
- Privacy policy: describes the localStorage flag, new retention wording, and under-18 under the DPDP Act.
- `robots.txt` blocks the content files for all bots, `sitemap.xml` adds the page, and `guide.md` gets the analytics rule.
- Plans in `docs/`: retention cron plan (not built), and this live-testing checklist.

Checks: `node scripts/check-starter-pack.js`. The browser tests were run locally (see the commit message for results).
Before merging: complete section 1 above on a preview or right after deploy.
