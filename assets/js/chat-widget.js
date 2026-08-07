/* assets/js/chat-widget.js
   Chat widget with lead capture for agras.elkfishrobotics.com.au
   Add one line before </body>:  <script src="/assets/js/chat-widget.js" defer></script>
   No dependencies. Injects its own styles. Change the CONFIG block to rebrand. */

(function () {
  "use strict";

  var CONFIG = {
    endpoint: "/api/chat",
    accent: "#E03C31",          // Elk Fish accent. Change to match your logo exactly.
    charcoal: "#1A1A1A",
    launcherLabel: "Ask about Agras",
    title: "Agras Assistant",
    subtitle: "Elk Fish Robotics",

    // PRESENCE
    // The green dot tracks whether the team is reachable now, not whether the
    // bot is running. The bot is always running, so a permanent green dot
    // would be decoration. Times are Perth local, 24 hour.
    hours: {
      open: 8,
      close: 17,
      days: [1, 2, 3, 4, 5],
      onlineText: "Online now",
      onlineSub: "Amy usually replies within the hour",
      offlineText: "Assistant online",
      offlineSub: "Amy replies next business day"
    },

    // LEAD CAPTURE
    // mode "optional"    = form shows first, all fields optional, visitor can skip
    // mode "before"      = form shows first, name and email required
    // mode "afterFirst"  = one free question, then the form
    // mode "off"         = no form at all
    gate: {
      mode: "off",
      leadForm: "agras-chat-leads",
      transcriptForm: "agras-chat-transcripts",
      heading: "Before we start",
      blurb: "Leave your name and email and Amy can follow up with specifications and pricing for your operation. Or skip and just ask your questions.",
      nameLabel: "Name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      enterpriseLabel: "Anything about your operation? (optional)",
      consent: "I am happy for Elk Fish Robotics to contact me about this enquiry.",
      privacyUrl: "/privacy",
      button: "Start chat",
      skip: "Skip and just chat"
    },

    greeting:
      "G'day, I'm the Agras assistant at Elk Fish. I can help with the T25P, T50, T70P and T100, coverage, and how the Australian weight limits change what each one carries.\n\nWhat's your name, and what are you looking at spraying?",
    disclaimer:
      "Automated assistant. This conversation is recorded so the team can follow up. Verify specifications and any regulatory question with the team before you rely on them.",
    starters: [
      "Which model suits 900 ha of broadacre?",
      "Why is the T100 tank smaller in Australia?",
      "What licence do I need to fly one?"
    ]
  };

  var AVATAR_SVG =
    '<svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true" focusable="false">' +
    '<circle cx="20" cy="20" r="20" fill="#D8D2CB"/>' +
    '<circle cx="20" cy="15.5" r="6.4" fill="#4A4540"/>' +
    '<path d="M6.6 34.2a13.9 13.9 0 0 1 26.8 0A19.9 19.9 0 0 1 20 40a19.9 19.9 0 0 1-13.4-5.8z" fill="#4A4540"/>' +
    '</svg>';

  var STYLES = [
    ".efr-chat *{box-sizing:border-box;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}",
    ".efr-launcher{position:fixed;right:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:10px;padding:14px 20px;border:0;border-radius:999px;background:" + CONFIG.charcoal + ";color:#fff;font-size:15px;font-weight:500;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.28);transition:transform .18s ease,box-shadow .18s ease}",
    ".efr-launcher:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(0,0,0,.34)}",
    ".efr-avatar{position:relative;flex:none;border-radius:50%;overflow:visible;background:#D8D2CB}",
    ".efr-avatar svg{display:block;border-radius:50%}",
    ".efr-avatar i.status{position:absolute;right:-1px;bottom:-1px;border-radius:50%;background:#2FA24A;border:2px solid #fff;display:block}",
    ".efr-avatar.off i.status{background:#B4B2A9}",
    ".efr-launcher .efr-avatar{width:34px;height:34px;margin-left:-6px}",
    ".efr-launcher .efr-avatar i.status{width:10px;height:10px;border-color:" + CONFIG.charcoal + "}",
    ".efr-launcher .lbl{display:flex;flex-direction:column;align-items:flex-start;line-height:1.25}",
    ".efr-launcher .lbl b{font-weight:500;font-size:14.5px}",
    ".efr-launcher .lbl em{font-style:normal;font-size:11px;opacity:.7;display:flex;align-items:center;gap:5px}",
    ".efr-launcher .lbl em s{width:6px;height:6px;border-radius:50%;background:#4FD675;text-decoration:none;display:block}",
    ".efr-head .efr-avatar{width:42px;height:42px}",
    ".efr-head .efr-avatar i.status{width:12px;height:12px;border-color:" + CONFIG.charcoal + "}",
    ".efr-head-id{display:flex;align-items:center;gap:12px}",
    ".efr-head p.status{display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;font-size:11.5px;opacity:.72;margin-top:2px}",
    ".efr-head p.status s{width:6px;height:6px;border-radius:50%;background:#4FD675;text-decoration:none;display:block;flex:none}",
    ".efr-head p.status.off s{background:#B4B2A9}",
    ".efr-msg-row{display:flex;gap:9px;align-items:flex-end;max-width:92%;align-self:flex-start}",
    ".efr-msg-row .efr-avatar{width:26px;height:26px;margin-bottom:2px}",
    ".efr-msg-row .efr-avatar i.status{display:none}",
    ".efr-panel{position:fixed;right:20px;bottom:20px;z-index:9999;width:410px;max-width:calc(100vw - 32px);height:min(760px,calc(100vh - 40px));display:none;flex-direction:column;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.3)}",
    ".efr-panel.open{display:flex}",
    ".efr-head{background:" + CONFIG.charcoal + ";color:#fff;padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;flex:none}",
    ".efr-head h3{margin:0;font-size:16px;font-weight:600}",
    ".efr-head p{margin:3px 0 0;font-size:12px;opacity:.62;letter-spacing:.06em;text-transform:uppercase}",
    ".efr-close{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;opacity:.7;padding:0 0 0 12px}",
    ".efr-close:hover{opacity:1}",

    ".efr-gate{flex:1;overflow-y:auto;padding:26px 22px;background:#fff}",
    ".efr-gate h4{margin:0 0 6px;font-size:18px;color:" + CONFIG.charcoal + "}",
    ".efr-gate>p{margin:0 0 20px;font-size:13.5px;line-height:1.55;color:#666}",
    ".efr-field{margin-bottom:14px}",
    ".efr-field label{display:block;font-size:12px;font-weight:600;color:#444;margin-bottom:5px}",
    ".efr-field input,.efr-field textarea{width:100%;border:1px solid #DDD;border-radius:9px;padding:11px 12px;font-size:14.5px;outline:none;resize:none}",
    ".efr-field input:focus,.efr-field textarea:focus{border-color:" + CONFIG.charcoal + "}",
    ".efr-field input.bad{border-color:" + CONFIG.accent + ";background:#FFF8F8}",
    ".efr-consent{display:flex;gap:9px;align-items:flex-start;margin:16px 0 4px;font-size:12px;line-height:1.5;color:#555}",
    ".efr-consent input{margin-top:2px;flex:none;width:15px;height:15px;accent-color:" + CONFIG.charcoal + "}",
    ".efr-consent a{color:" + CONFIG.charcoal + "}",
    ".efr-gate-err{color:" + CONFIG.accent + ";font-size:12.5px;margin:10px 0 0;min-height:16px}",
    ".efr-gate-btn{width:100%;margin-top:14px;background:" + CONFIG.charcoal + ";border:0;border-radius:10px;color:#fff;padding:14px;font-size:15px;font-weight:600;cursor:pointer}",
    ".efr-gate-btn:disabled{opacity:.5;cursor:not-allowed}",
    ".efr-skip{display:block;width:100%;margin-top:10px;background:none;border:0;color:#8A8A8A;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:6px}",
    ".efr-skip:hover{color:" + CONFIG.charcoal + "}",
    ".efr-consent.hidden{display:none}",
    ".efr-hp{position:absolute;left:-9999px;opacity:0;height:0}",

    ".efr-log{flex:1;overflow-y:auto;padding:20px;background:#FAFAFA;display:flex;flex-direction:column;gap:12px}",
    ".efr-msg{max-width:88%;padding:11px 14px;border-radius:12px;font-size:14.5px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word}",
    ".efr-msg.bot{background:#fff;border:1px solid #E8E8E8;color:#1A1A1A;align-self:flex-start;border-bottom-left-radius:4px}",
    ".efr-msg.user{background:" + CONFIG.charcoal + ";color:#fff;align-self:flex-end;border-bottom-right-radius:4px}",
    ".efr-msg.err{background:#FFF3F2;border:1px solid #F3C9C5;color:#8A2A22;align-self:flex-start}",
    ".efr-starters{display:flex;flex-wrap:wrap;gap:7px;padding-top:2px}",
    ".efr-starters button{background:#fff;border:1px solid #DDD;border-radius:999px;padding:7px 13px;font-size:12.5px;color:#444;cursor:pointer}",
    ".efr-starters button:hover{border-color:" + CONFIG.accent + ";color:" + CONFIG.accent + "}",
    ".efr-typing{display:flex;gap:4px;align-self:flex-start;padding:13px 15px;background:#fff;border:1px solid #E8E8E8;border-radius:12px}",
    ".efr-typing i{width:6px;height:6px;border-radius:50%;background:#B8B8B8;animation:efrb 1.3s infinite}",
    ".efr-typing i:nth-child(2){animation-delay:.18s}.efr-typing i:nth-child(3){animation-delay:.36s}",
    "@keyframes efrb{0%,60%,100%{opacity:.3}30%{opacity:1}}",
    ".efr-foot{border-top:1px solid #EAEAEA;background:#fff;padding:12px 14px;flex:none}",
    ".efr-row{display:flex;gap:8px;align-items:flex-end}",
    ".efr-row textarea{flex:1;resize:none;border:1px solid #DDD;border-radius:10px;padding:11px 13px;font-size:14.5px;line-height:1.4;max-height:110px;outline:none}",
    ".efr-row textarea:focus{border-color:" + CONFIG.charcoal + "}",
    ".efr-send{background:" + CONFIG.accent + ";border:0;border-radius:10px;color:#fff;padding:0 17px;height:42px;font-size:14px;font-weight:600;cursor:pointer}",
    ".efr-send:disabled{opacity:.45;cursor:not-allowed}",
    ".efr-note{margin:9px 2px 0;font-size:10.5px;color:#9A9A9A;line-height:1.45}",
    // Touch targets and tap feel
    ".efr-chat button{-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
    ".efr-close{min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;margin:-10px -10px -10px 0}",
    ".efr-log{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}",
    ".efr-gate{overscroll-behavior:contain}",

    // Tablet: a little more room than desktop, portrait and landscape
    "@media(min-width:641px) and (max-width:1024px){",
    ".efr-panel{width:440px;height:min(820px,calc(100vh - 48px));right:24px;bottom:24px}",
    ".efr-launcher{right:24px;bottom:24px;padding:15px 22px 15px 13px}",
    ".efr-msg{font-size:15px}",
    ".efr-row textarea{font-size:15px}",
    "}",

    // Phones: full screen, safe areas, and 16px inputs so iOS does not zoom
    "@media(max-width:640px){",
    ".efr-panel{right:0;bottom:0;left:0;top:0;width:100%;max-width:100%;height:100vh;height:100dvh;border-radius:0}",
    ".efr-head{padding-top:calc(16px + env(safe-area-inset-top))}",
    ".efr-foot{padding-bottom:calc(12px + env(safe-area-inset-bottom))}",
    ".efr-log{padding:16px}",
    ".efr-gate{padding-bottom:calc(26px + env(safe-area-inset-bottom))}",
    ".efr-msg{max-width:90%;font-size:15px}",
    ".efr-row textarea{font-size:16px;padding:12px 13px}",
    ".efr-send{height:46px;min-width:64px}",
    ".efr-field input,.efr-field textarea{font-size:16px}",
    ".efr-gate-btn{padding:15px}",
    ".efr-launcher{right:16px;bottom:calc(16px + env(safe-area-inset-bottom));padding:11px 18px 11px 9px}",
    ".efr-launcher .efr-avatar{width:30px;height:30px;margin-left:0}",
    ".efr-launcher .lbl b{font-size:14px}",
    "}",

    // Very narrow phones: shorten the launcher so it does not span the screen
    "@media(max-width:360px){",
    ".efr-launcher .lbl em{display:none}",
    ".efr-launcher .lbl b{font-size:13.5px}",
    "}",

    // Short landscape phones: the keyboard leaves almost nothing, so trim chrome
    "@media(max-height:480px) and (orientation:landscape){",
    ".efr-head{padding-top:10px;padding-bottom:10px}",
    ".efr-head .efr-avatar{width:32px;height:32px}",
    ".efr-note{display:none}",
    ".efr-log{padding:12px 16px;gap:8px}",
    "}",

    "@media(prefers-reduced-motion:reduce){",
    ".efr-launcher{transition:none}",
    ".efr-typing i{animation:none;opacity:.5}",
    "}"
  ].join("");

  var history = [];
  var lead = null;
  var busy = false;
  var gatePassed = CONFIG.gate.mode === "off";
  var transcriptSent = false;
  var leadSent = false;
  var idleTimer = null;
  var IDLE_MS = 180000;
  var panel, gate, chatArea, log, foot, input, sendBtn, launcher;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function scroll() { log.scrollTop = log.scrollHeight; }

  // Perth local time, regardless of where the visitor's device is set.
  function teamOnline() {
    var h = CONFIG.hours;
    if (!h) return true;
    try {
      var parts = new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Perth",
        weekday: "short",
        hour: "numeric",
        hour12: false
      }).formatToParts(new Date());
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var day = map[parts.find(function (p) { return p.type === "weekday"; }).value];
      var hour = parseInt(parts.find(function (p) { return p.type === "hour"; }).value, 10);
      return h.days.indexOf(day) !== -1 && hour >= h.open && hour < h.close;
    } catch (e) {
      return true;
    }
  }

  function avatar(withStatus) {
    var a = el("div", "efr-avatar" + (withStatus && !teamOnline() ? " off" : ""));
    a.innerHTML = AVATAR_SVG;
    if (withStatus) {
      var s = el("i", "status");
      a.appendChild(s);
    }
    return a;
  }

  function addMessage(role, text) {
    var cls = role === "user" ? "efr-msg user" : role === "error" ? "efr-msg err" : "efr-msg bot";
    var bubble = el("div", cls, text);
    if (role === "user") {
      log.appendChild(bubble);
    } else {
      var row = el("div", "efr-msg-row");
      row.appendChild(avatar(false));
      row.appendChild(bubble);
      log.appendChild(row);
    }
    scroll();
  }

  function postForm(formName, fields) {
    var payload = { "form-name": formName };
    Object.keys(fields).forEach(function (k) { payload[k] = fields[k] || ""; });
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString()
    });
  }

  function sendTranscript(reason) {
    if (transcriptSent) return;

    var userTurns = history.filter(function (m) { return m.role === "user"; });
    if (userTurns.length === 0) return; // nothing was actually asked

    transcriptSent = true;
    clearTimeout(idleTimer);

    var text = history.map(function (m) {
      return (m.role === "user" ? "VISITOR: " : "BOT: ") + m.content;
    }).join("\n\n");

    var who = (lead && lead.name) || "Anonymous visitor";
    if (lead && (lead.email || lead.phone)) who += " [contactable]";
    var summary = userTurns[0].content.replace(/\s+/g, " ").slice(0, 110);

    var body = new URLSearchParams({
      "form-name": CONFIG.gate.transcriptForm,
      summary: who + ": " + summary,
      name: (lead && lead.name) || "",
      email: (lead && lead.email) || "",
      phone: (lead && lead.phone) || "",
      enterprise: (lead && lead.enterprise) || "",
      questions: String(userTurns.length),
      ended: reason || "closed",
      page: location.pathname,
      transcript: text.slice(0, 20000)
    }).toString();

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/", new Blob([body], { type: "application/x-www-form-urlencoded" }));
    } else {
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body,
        keepalive: true
      }).catch(function () {});
    }
  }

  // If they wander off without closing the panel, send anyway after a quiet spell.
  // The bot captured details mid-conversation. Merge them and send the lead
  // through, but only once we have something the team can actually act on.
  function mergeCaptured(c) {
    lead = lead || { name: "", email: "", phone: "", enterprise: "" };
    ["name", "email", "phone"].forEach(function (k) {
      if (c[k] && !lead[k]) lead[k] = c[k];
    });
    if (c.notes && !lead.enterprise) lead.enterprise = c.notes;

    if (!lead.email && !lead.phone) return; // a name alone is not a lead
    if (leadSent) return;
    leadSent = true;

    postForm(CONFIG.gate.leadForm, {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      enterprise: lead.enterprise,
      page: location.pathname,
      "bot-field": ""
    }).catch(function (e) { console.warn("Lead submission failed", e); });
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { sendTranscript("idle"); }, IDLE_MS);
  }

  function showStarters() {
    var wrap = el("div", "efr-starters");
    CONFIG.starters.forEach(function (s) {
      var b = el("button", null, s);
      b.addEventListener("click", function () { wrap.remove(); send(s); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    scroll();
  }

  function typing(on) {
    var existing = log.querySelector(".efr-typing");
    if (on && !existing) {
      var t = el("div", "efr-typing");
      t.innerHTML = "<i></i><i></i><i></i>";
      var trow = el("div", "efr-msg-row");
      trow.appendChild(avatar(false));
      trow.appendChild(t);
      log.appendChild(trow);
      scroll();
    } else if (!on && existing) {
      (existing.parentNode.classList.contains("efr-msg-row") ? existing.parentNode : existing).remove();
    }
  }

  // On phones the panel is full screen, so stop the page scrolling behind it
  // and restore the scroll position exactly on close.
  var savedScrollY = 0;
  function lockPage(on) {
    if (!window.matchMedia || !window.matchMedia("(max-width:640px)").matches) return;
    var b = document.body;
    if (on) {
      savedScrollY = window.scrollY || 0;
      b.style.position = "fixed";
      b.style.top = -savedScrollY + "px";
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
    } else {
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      window.scrollTo(0, savedScrollY);
    }
  }

  function openChat() {
    if (gate) gate.style.display = "none";
    chatArea.style.display = "flex";
    foot.style.display = "block";
    if (!log.childElementCount) {
      addMessage("bot", CONFIG.greeting);
      showStarters();
    }
    input.focus();
  }

  function buildGate() {
    gate = el("div", "efr-gate");
    gate.appendChild(el("h4", null, CONFIG.gate.heading));
    gate.appendChild(el("p", null, CONFIG.gate.blurb));

    function field(label, name, type, isTextarea) {
      var wrap = el("div", "efr-field");
      var l = el("label", null, label);
      l.setAttribute("for", "efr-" + name);
      var i = el(isTextarea ? "textarea" : "input");
      i.id = "efr-" + name;
      i.name = name;
      if (!isTextarea) i.type = type;
      if (isTextarea) i.rows = 2;
      i.autocomplete = name === "email" ? "email" : name === "name" ? "name" : "off";
      wrap.appendChild(l);
      wrap.appendChild(i);
      gate.appendChild(wrap);
      return i;
    }

    var optional = CONFIG.gate.mode === "optional";
    var nameIn = field(optional ? CONFIG.gate.nameLabel : "Name", "name", "text");
    var emailIn = field(optional ? CONFIG.gate.emailLabel : "Email", "email", "email");
    var entIn = field(CONFIG.gate.enterpriseLabel, "enterprise", "text", true);

    var hp = el("input", "efr-hp");
    hp.type = "text";
    hp.name = "bot-field";
    hp.tabIndex = -1;
    gate.appendChild(hp);

    var consentWrap = el("label", "efr-consent");
    var consent = el("input");
    consent.type = "checkbox";
    consentWrap.appendChild(consent);
    var ctext = el("span");
    ctext.innerHTML = CONFIG.gate.consent +
      (CONFIG.gate.privacyUrl ? ' <a href="' + CONFIG.gate.privacyUrl + '" target="_blank" rel="noopener">Privacy</a>.' : "");
    consentWrap.appendChild(ctext);
    gate.appendChild(consentWrap);

    // In optional mode the consent tick only appears once an email is entered,
    // because there is nothing to consent to until then.
    function syncConsent() {
      if (!optional) return;
      consentWrap.classList.toggle("hidden", emailIn.value.trim() === "");
    }
    if (optional) consentWrap.classList.add("hidden");
    emailIn.addEventListener("input", syncConsent);

    var err = el("p", "efr-gate-err");
    gate.appendChild(err);

    var btn = el("button", "efr-gate-btn", CONFIG.gate.button);
    gate.appendChild(btn);

    var skipBtn = null;
    if (optional) {
      skipBtn = el("button", "efr-skip", CONFIG.gate.skip);
      gate.appendChild(skipBtn);
      skipBtn.addEventListener("click", function () {
        lead = null;
        gatePassed = true;
        openChat();
      });
    }

    btn.addEventListener("click", function () {
      err.textContent = "";
      nameIn.classList.remove("bad");
      emailIn.classList.remove("bad");

      var name = nameIn.value.trim();
      var email = emailIn.value.trim();
      var enterprise = entIn.value.trim().slice(0, 200);

      if (!optional) {
        if (name.length < 2) {
          nameIn.classList.add("bad");
          err.textContent = "Please add your name.";
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          emailIn.classList.add("bad");
          err.textContent = "That email does not look right.";
          return;
        }
        if (!consent.checked) {
          err.textContent = "Please tick the box so we can contact you.";
          return;
        }
      } else {
        // Optional mode: only validate what they actually chose to give us.
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          emailIn.classList.add("bad");
          err.textContent = "That email does not look right. Leave it blank if you would rather not.";
          return;
        }
        if (email && !consent.checked) {
          err.textContent = "Please tick the box, or clear the email field to skip.";
          return;
        }
      }
      if (hp.value) return; // honeypot tripped

      lead = name || email || enterprise ? { name: name, email: email, enterprise: enterprise } : null;

      // Nothing given, or no email to send anywhere: start chatting immediately.
      if (!lead || !lead.email) {
        gatePassed = true;
        openChat();
        return;
      }

      btn.disabled = true;
      btn.textContent = "One moment";

      postForm(CONFIG.gate.leadForm, {
        name: lead.name,
        email: lead.email,
        enterprise: lead.enterprise,
        page: location.pathname,
        "bot-field": ""
      }).catch(function (e) {
        console.warn("Lead submission failed", e);
      }).finally(function () {
        gatePassed = true;
        openChat();
      });
    });

    [nameIn, emailIn].forEach(function (i) {
      i.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); btn.click(); }
      });
    });

    return gate;
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;

    if (!gatePassed && CONFIG.gate.mode === "afterFirst" && history.length >= 2) {
      chatArea.style.display = "none";
      foot.style.display = "none";
      gate.style.display = "block";
      return;
    }

    busy = true;
    sendBtn.disabled = true;
    input.value = "";
    input.style.height = "auto";

    addMessage("user", text);
    history.push({ role: "user", content: text });
    typing(true);

    fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, lead: lead })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        typing(false);
        if (!res.ok || !res.data.reply) {
          addMessage("error", res.data.error || "The assistant is unavailable. Email amy-may@elkfishrobotics.com.au and we will come back to you.");
          history.pop();
          return;
        }
        addMessage("bot", res.data.reply);
        history.push({ role: "assistant", content: res.data.reply });
        if (res.data.captured) mergeCaptured(res.data.captured);
        resetIdleTimer();
      })
      .catch(function () {
        typing(false);
        history.pop();
        addMessage("error", "Connection failed. Email amy-may@elkfishrobotics.com.au and we will come back to you.");
      })
      .finally(function () {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      });
  }

  function build() {
    // Idempotency guard: if the script is included on a page twice, or a
    // framework re-runs it, mount only once.
    if (window.__efrAgrasChatMounted) return;
    window.__efrAgrasChatMounted = true;

    var style = el("style");
    style.textContent = STYLES;
    document.head.appendChild(style);

    launcher = el("button", "efr-launcher efr-chat");
    launcher.setAttribute("aria-label", "Open the Agras assistant");
    launcher.appendChild(avatar(true));
    var lbl = el("div", "lbl");
    var lb = el("b", null, CONFIG.launcherLabel);
    var le = el("em");
    le.appendChild(el("s"));
    le.appendChild(document.createTextNode(teamOnline() ? CONFIG.hours.onlineText : CONFIG.hours.offlineText));
    if (!teamOnline()) le.querySelector("s").style.background = "#B4B2A9";
    lbl.appendChild(lb);
    lbl.appendChild(le);
    launcher.appendChild(lbl);

    panel = el("div", "efr-panel efr-chat");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", CONFIG.title);

    var head = el("div", "efr-head");
    var headId = el("div", "efr-head-id");
    headId.appendChild(avatar(true));
    var headText = el("div");
    headText.appendChild(el("h3", null, CONFIG.title));
    var online = teamOnline();
    var st = el("p", "status" + (online ? "" : " off"));
    st.appendChild(el("s"));
    st.appendChild(document.createTextNode(online ? CONFIG.hours.onlineSub : CONFIG.hours.offlineSub));
    headText.appendChild(st);
    headId.appendChild(headText);
    var close = el("button", "efr-close", "\u00D7");
    close.setAttribute("aria-label", "Close");
    head.appendChild(headId);
    head.appendChild(close);

    chatArea = el("div", "efr-log");
    log = chatArea;

    foot = el("div", "efr-foot");
    var row = el("div", "efr-row");
    input = el("textarea");
    input.rows = 1;
    input.placeholder = "Ask about coverage, models, licensing...";
    sendBtn = el("button", "efr-send", "Send");
    row.appendChild(input);
    row.appendChild(sendBtn);
    foot.appendChild(row);
    foot.appendChild(el("p", "efr-note", CONFIG.disclaimer));

    panel.appendChild(head);
    if (CONFIG.gate.mode !== "off") {
      panel.appendChild(buildGate());
    }
    panel.appendChild(chatArea);
    panel.appendChild(foot);

    if (CONFIG.gate.mode === "before" || CONFIG.gate.mode === "optional") {
      chatArea.style.display = "none";
      foot.style.display = "none";
    } else if (gate) {
      gate.style.display = "none";
    }

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    launcher.addEventListener("click", function () {
      panel.classList.add("open");
      launcher.style.display = "none";
      lockPage(true);
      if ((CONFIG.gate.mode === "before" || CONFIG.gate.mode === "optional") && !gatePassed) {
        gate.querySelector("input").focus();
      } else {
        openChat();
      }
    });

    close.addEventListener("click", function () {
      sendTranscript("closed");
      lockPage(false);
      panel.classList.remove("open");
      launcher.style.display = "flex";
    });

    sendBtn.addEventListener("click", function () { send(input.value); });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });

    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 110) + "px";
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) close.click();
    });

    window.addEventListener("pagehide", function () { sendTranscript("left page"); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
