(function () {
  var script = document.currentScript;

  if (!script) {
    return;
  }

  var defaults = {
    creator: "내 프로젝트",
    headline: "이 프로젝트를 후원해 주세요",
    description: "위젯, API, 결제 흐름을 모두 직접 운영하며 후원을 받을 수 있습니다.",
    buttonText: "후원 위젯 열기",
    checkoutText: "체크아웃으로 이동",
    theme: "sunset",
    currency: "KRW",
    presets: "5000,10000,30000",
    minAmount: "1000",
    maxAmount: "500000",
    projectId: "default",
    campaign: "default",
    method: "CARD",
    autoApprove: "false",
    note: "결제 링크는 내 백엔드에서 생성됩니다.",
    accent: "",
    target: "",
    bootstrapToken: "",
    embedToken: "",
    bootstrapPath: "/api/embed/bootstrap",
    apiPath: "/api/create-payment",
    trackingPath: "/api/track"
  };

  var themes = {
    sunset: {
      background: "linear-gradient(135deg, #fff1d6 0%, #ffc9a9 48%, #ff9f7a 100%)",
      panel: "rgba(255, 255, 255, 0.86)",
      text: "#2a170c",
      muted: "#72503b",
      accent: "#d94841",
      accentText: "#fff8f6",
      overlay: "rgba(34, 16, 10, 0.58)"
    },
    mint: {
      background: "linear-gradient(135deg, #ddf9ef 0%, #c3f0d5 52%, #8bd7b4 100%)",
      panel: "rgba(247, 255, 251, 0.88)",
      text: "#0e2d24",
      muted: "#436559",
      accent: "#127c58",
      accentText: "#f8fffb",
      overlay: "rgba(7, 28, 22, 0.56)"
    },
    ocean: {
      background: "linear-gradient(135deg, #d9efff 0%, #a8d8ff 52%, #73b8ff 100%)",
      panel: "rgba(248, 252, 255, 0.88)",
      text: "#0f2841",
      muted: "#4d708d",
      accent: "#165fc1",
      accentText: "#f7fbff",
      overlay: "rgba(8, 25, 43, 0.58)"
    },
    graphite: {
      background: "linear-gradient(135deg, #1e2430 0%, #364155 56%, #56657e 100%)",
      panel: "rgba(14, 18, 26, 0.82)",
      text: "#f2f5fb",
      muted: "#c0c8d8",
      accent: "#ffd166",
      accentText: "#271f0a",
      overlay: "rgba(0, 0, 0, 0.64)"
    }
  };

  function readOption(name) {
    var attr = script.getAttribute(
      "data-" +
        name.replace(/[A-Z]/g, function (char) {
          return "-" + char.toLowerCase();
        })
    );
    return attr !== null && attr !== "" ? attr : defaults[name];
  }

  function sanitizeText(value, fallback, maxLength) {
    var text = String(value == null ? fallback : value).trim();
    if (!text) {
      text = fallback;
    }
    return text.slice(0, maxLength);
  }

  function sanitizeCssColor(value) {
    var color = String(value || "").trim();
    if (!color) {
      return "";
    }
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
      return color;
    }
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%]+\)$/i.test(color)) {
      return color;
    }
    return "";
  }

  function parseAmount(value, fallback) {
    var amount = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(amount) ? Math.round(amount) : fallback;
  }

  function parsePresets(value, minAmount, maxAmount) {
    var items = String(value)
      .split(",")
      .map(function (item) {
        return parseAmount(item, 0);
      })
      .filter(function (amount) {
        return amount >= minAmount && amount <= maxAmount;
      });

    return items.length ? items.slice(0, 4) : [5000, 10000, 30000];
  }

  function formatMoney(amount, currency) {
    try {
      if (!formatMoney.cache) {
        formatMoney.cache = {};
      }

      if (!formatMoney.cache[currency]) {
        formatMoney.cache[currency] = new Intl.NumberFormat("ko-KR", {
          style: "currency",
          currency: currency
        });
      }

      return formatMoney.cache[currency].format(amount);
    } catch (error) {
      return currency + " " + Number(amount).toLocaleString("ko-KR");
    }
  }

  function buildApiUrl(path) {
    var base = new URL(script.src, window.location.href);
    return new URL(path, base.origin).toString();
  }

  function buildDefaultBootstrapUrl(apiUrl, trackingUrl) {
    try {
      return new URL("/api/embed/bootstrap", apiUrl || trackingUrl || script.src).toString();
    } catch (error) {
      return buildApiUrl(defaults.bootstrapPath);
    }
  }

  function randomId(prefix) {
    if (window.crypto && window.crypto.getRandomValues) {
      var array = new Uint32Array(4);
      window.crypto.getRandomValues(array);
      return prefix + "-" + Array.prototype.map.call(array, function (item) {
        return item.toString(16);
      }).join("");
    }

    return prefix + "-" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function safeStorage(storage) {
    try {
      var testKey = "__donation_widget_test__";
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return storage;
    } catch (error) {
      return null;
    }
  }

  function getOrCreateStorageValue(storage, key, prefix) {
    if (!storage) {
      return randomId(prefix);
    }

    var value = storage.getItem(key);
    if (!value) {
      value = randomId(prefix);
      storage.setItem(key, value);
    }

    return value;
  }

  function getTheme(name, accent) {
    var theme = themes[name] || themes.sunset;
    return {
      background: theme.background,
      panel: theme.panel,
      text: theme.text,
      muted: theme.muted,
      accent: accent || theme.accent,
      accentText: theme.accentText,
      overlay: theme.overlay
    };
  }

  function createNode(tagName, className, text) {
    var node = document.createElement(tagName);
    if (className) {
      node.className = className;
    }
    if (text != null) {
      node.textContent = text;
    }
    return node;
  }

  var minAmount = parseAmount(readOption("minAmount"), 1000);
  var maxAmount = parseAmount(readOption("maxAmount"), 500000);
  var bootstrapPathOption = String(readOption("bootstrapPath") || "").trim();
  var apiUrl = buildApiUrl(readOption("apiPath"));
  var trackingUrl = buildApiUrl(readOption("trackingPath"));
  var options = {
    creator: sanitizeText(readOption("creator"), defaults.creator, 48),
    headline: sanitizeText(readOption("headline"), defaults.headline, 90),
    description: sanitizeText(readOption("description"), defaults.description, 180),
    buttonText: sanitizeText(readOption("buttonText"), defaults.buttonText, 30),
    checkoutText: sanitizeText(readOption("checkoutText"), defaults.checkoutText, 30),
    theme: sanitizeText(readOption("theme"), defaults.theme, 20),
    currency: sanitizeText(readOption("currency"), defaults.currency, 5).toUpperCase(),
    presets: parsePresets(readOption("presets"), minAmount, maxAmount),
    minAmount: minAmount,
    maxAmount: maxAmount,
    projectId: sanitizeText(readOption("projectId"), defaults.projectId, 80),
    campaign: sanitizeText(readOption("campaign"), defaults.campaign, 48),
    method: sanitizeText(readOption("method"), defaults.method, 32).toUpperCase(),
    autoApprove: String(readOption("autoApprove")).toLowerCase() === "true",
    note: sanitizeText(readOption("note"), defaults.note, 120),
    accent: sanitizeCssColor(readOption("accent")),
    target: String(readOption("target") || "").trim(),
    bootstrapToken: sanitizeText(readOption("bootstrapToken"), sanitizeText(readOption("embedToken"), defaults.embedToken, 600), 600),
    embedToken: sanitizeText(readOption("embedToken"), defaults.embedToken, 600),
    bootstrapUrl: bootstrapPathOption ? buildApiUrl(bootstrapPathOption) : buildDefaultBootstrapUrl(apiUrl, trackingUrl),
    apiUrl: apiUrl,
    trackingUrl: trackingUrl
  };

  var palette = getTheme(options.theme, options.accent);
  var mount = document.createElement("div");
  var localStore = safeStorage(window.localStorage);
  var sessionStore = safeStorage(window.sessionStorage);
  var visitorId = getOrCreateStorageValue(localStore, "donation_widget_visitor_id", "visitor");
  var sessionId = getOrCreateStorageValue(sessionStore, "donation_widget_session_id", "session");
  var pageStartAt = Date.now();
  var pagePath = window.location.pathname + window.location.search;
  var pageUrl = window.location.origin + pagePath;
  var hasSentEngagement = false;
  var previousBodyOverflow = "";
  var busy = false;
  var runtimeSessionToken = "";
  var runtimeSessionExpiresAt = 0;
  var runtimeSessionPromise = null;

  if (!window.__donationWidgetTrackedViews) {
    window.__donationWidgetTrackedViews = {};
  }

  if (!window.__donationWidgetTrackedEngagements) {
    window.__donationWidgetTrackedEngagements = {};
  }

  ensureRuntimeSession(false).catch(function () {
  });

  function placeMount() {
    if (options.target) {
      var targetNode = document.querySelector(options.target);
      if (targetNode) {
        targetNode.appendChild(mount);
        return;
      }
    }

    if (script.parentNode && String(script.parentNode.tagName).toUpperCase() !== "HEAD") {
      script.insertAdjacentElement("afterend", mount);
      return;
    }

    if (document.body) {
      document.body.insertAdjacentElement("afterbegin", mount);
    }
  }

  if (script.parentNode && (String(script.parentNode.tagName).toUpperCase() !== "HEAD" || document.body)) {
    placeMount();
  } else {
    window.addEventListener("DOMContentLoaded", placeMount, { once: true });
  }

  function parseIsoTimestamp(value) {
    var timestamp = Date.parse(String(value || ""));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function hasActiveRuntimeSession(bufferMs) {
    return !!runtimeSessionToken && runtimeSessionExpiresAt - Date.now() > (bufferMs || 0);
  }

  function requestRuntimeSession() {
    return fetch(options.bootstrapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectId: options.projectId,
        visitorId: visitorId,
        sessionId: sessionId,
        pageUrl: pageUrl,
        pagePath: pagePath,
        host: window.location.host,
        referrer: document.referrer || "",
        bootstrapToken: options.bootstrapToken || undefined,
        widgetVersion: "v1"
      })
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "임베드 세션을 만들지 못했습니다.");
        }

        runtimeSessionToken = typeof data.sessionToken === "string" ? data.sessionToken : "";
        runtimeSessionExpiresAt = parseIsoTimestamp(data.expiresAt);
        if (!runtimeSessionToken || !runtimeSessionExpiresAt) {
          throw new Error("임베드 세션 응답이 올바르지 않습니다.");
        }

        return runtimeSessionToken;
      });
    });
  }

  function ensureRuntimeSession(forceRefresh) {
    if (!forceRefresh && hasActiveRuntimeSession(60 * 1000)) {
      return Promise.resolve(runtimeSessionToken);
    }

    if (runtimeSessionPromise) {
      return runtimeSessionPromise;
    }

    runtimeSessionPromise = requestRuntimeSession().finally(function () {
      runtimeSessionPromise = null;
    });

    return runtimeSessionPromise;
  }

  function buildTrackPayload(eventType, extra, sessionToken) {
    return {
      eventType: eventType,
      projectId: options.projectId,
      visitorId: visitorId,
      sessionId: sessionId,
      creator: options.creator,
      campaign: options.campaign,
      host: window.location.host,
      pageUrl: pageUrl,
      pagePath: pagePath,
      referrer: document.referrer || "",
      embedSession: sessionToken || undefined,
      durationMs: extra && typeof extra.durationMs === "number" ? extra.durationMs : undefined,
      metadata: extra && extra.metadata ? extra.metadata : {}
    };
  }

  function sendTrackEvent(eventType, extra) {
    var useBeacon = !!(extra && extra.useBeacon);

    if (useBeacon && navigator.sendBeacon) {
      if (!hasActiveRuntimeSession()) {
        return;
      }

      try {
        var beaconPayload = buildTrackPayload(eventType, extra, runtimeSessionToken);
        var blob = new Blob([JSON.stringify(beaconPayload)], {
          type: "application/json"
        });
        navigator.sendBeacon(options.trackingUrl, blob);
        return;
      } catch (error) {
      }
    }

    ensureRuntimeSession(false)
      .then(function (sessionToken) {
        var payload = buildTrackPayload(eventType, extra, sessionToken);
        return fetch(options.trackingUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          keepalive: useBeacon
        }).then(function (response) {
          if (response.status !== 403) {
            return response;
          }

          return ensureRuntimeSession(true).then(function (refreshedSessionToken) {
            payload.embedSession = refreshedSessionToken;
            return fetch(options.trackingUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload),
              keepalive: useBeacon
            });
          });
        });
      })
      .catch(function () {
      });
  }

  var viewKey = options.projectId + "::" + options.campaign + "::" + pageUrl;
  if (!window.__donationWidgetTrackedViews[viewKey]) {
    window.__donationWidgetTrackedViews[viewKey] = true;
    sendTrackEvent("view", {
      metadata: {
        source: "embed"
      }
    });
  }

  function flushEngagement(trigger, useBeacon) {
    if (hasSentEngagement || window.__donationWidgetTrackedEngagements[viewKey]) {
      return;
    }

    hasSentEngagement = true;
    window.__donationWidgetTrackedEngagements[viewKey] = true;
    sendTrackEvent("engagement", {
      durationMs: Date.now() - pageStartAt,
      metadata: {
        source: "embed",
        trigger: trigger || "pagehide"
      },
      useBeacon: useBeacon !== false
    });
  }

  window.addEventListener("pagehide", function () {
    flushEngagement("pagehide", true);
  }, { once: true });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      flushEngagement("hidden", true);
    }
  });

  var root = mount.attachShadow({ mode: "open" });
  root.innerHTML =
    "<style>" +
    ":host{all:initial;}" +
    ".shell,.shell *{box-sizing:border-box;}" +
    ".shell{font-family:Arial,Helvetica,sans-serif;color:" + palette.text + ";}" +
    ".banner{position:relative;overflow:hidden;padding:24px;border-radius:26px;background:" + palette.background + ";box-shadow:0 24px 64px rgba(15,23,42,.18);}" +
    ".panel{display:grid;gap:16px;padding:22px;border-radius:22px;background:" + palette.panel + ";backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.24);}" +
    ".badge{display:inline-flex;width:max-content;align-items:center;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.48);font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:" + palette.muted + ";}" +
    ".headline{margin:0;font-size:28px;line-height:1.15;font-weight:900;word-break:keep-all;}" +
    ".description{margin:0;font-size:15px;line-height:1.65;color:" + palette.muted + ";}" +
    ".footer{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;}" +
    ".preset-row{display:flex;gap:8px;flex-wrap:wrap;}" +
    ".pill{display:inline-flex;align-items:center;min-height:38px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.62);font-size:13px;font-weight:800;color:" + palette.text + ";}" +
    ".primary{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 20px;border:none;border-radius:999px;background:" + palette.accent + ";color:" + palette.accentText + ";font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 12px 24px rgba(15,23,42,.16);transition:transform .18s ease,box-shadow .18s ease;}" +
    ".primary:hover{transform:translateY(-1px);box-shadow:0 16px 28px rgba(15,23,42,.22);}" +
    ".modal-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:20px;background:" + palette.overlay + ";z-index:2147483647;}" +
    ".modal-backdrop[data-open='true']{display:flex;}" +
    ".modal{width:min(100%,520px);padding:22px;border-radius:28px;background:" + palette.panel + ";backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.26);box-shadow:0 30px 80px rgba(15,23,42,.28);}" +
    ".modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;}" +
    ".modal-title{margin:0;font-size:24px;line-height:1.2;font-weight:900;}" +
    ".modal-copy{margin:8px 0 0;font-size:14px;line-height:1.65;color:" + palette.muted + ";}" +
    ".close,.ghost{display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;color:" + palette.text + ";background:rgba(255,255,255,.58);}" +
    ".close{width:42px;height:42px;border-radius:999px;font-size:22px;}" +
    ".field{display:grid;gap:8px;margin-bottom:15px;}" +
    ".label{font-size:13px;font-weight:800;color:" + palette.muted + ";}" +
    ".chip-row{display:flex;gap:8px;flex-wrap:wrap;}" +
    ".chip{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 14px;border:1px solid transparent;border-radius:999px;background:rgba(255,255,255,.66);font-size:14px;font-weight:800;color:" + palette.text + ";cursor:pointer;}" +
    ".chip[data-active='true']{background:" + palette.accent + ";color:" + palette.accentText + ";}" +
    ".amount-input,.name-input,.message-input{width:100%;padding:13px 15px;border:1px solid rgba(15,23,42,.08);border-radius:16px;background:rgba(255,255,255,.86);font:inherit;color:#111827;}" +
    ".message-input{min-height:92px;resize:vertical;}" +
    ".hint,.submit-note{font-size:12px;line-height:1.5;color:" + palette.muted + ";}" +
    ".error{display:none;padding:12px 14px;border-radius:16px;background:rgba(217,72,65,.12);font-size:13px;line-height:1.5;color:#8a1c16;}" +
    ".error[data-visible='true']{display:block;}" +
    ".actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px;}" +
    ".ghost{min-height:48px;padding:0 18px;border-radius:999px;font-size:14px;font-weight:800;}" +
    ".primary[disabled],.ghost[disabled]{opacity:.65;cursor:wait;transform:none;}" +
    "@media (max-width:720px){.banner{padding:18px;border-radius:22px;}.panel{padding:18px;border-radius:18px;}.headline{font-size:24px;}.footer,.actions{align-items:stretch;}.primary,.ghost{width:100%;}.modal{padding:18px;border-radius:22px;}}" +
    "</style>" +
    '<section class="shell">' +
    '  <div class="banner">' +
    '    <div class="panel">' +
    '      <span class="badge"></span>' +
    '      <h2 class="headline"></h2>' +
    '      <p class="description"></p>' +
    '      <div class="footer">' +
    '        <div class="preset-row"></div>' +
    '        <button class="primary open-button" type="button"></button>' +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    '  <div class="modal-backdrop" data-open="false">' +
    '    <div class="modal" role="dialog" aria-modal="true">' +
    '      <div class="modal-head">' +
    "        <div>" +
    '          <h3 class="modal-title"></h3>' +
    '          <p class="modal-copy"></p>' +
    "        </div>" +
    '        <button class="close" type="button" aria-label="닫기">×</button>' +
    "      </div>" +
    '      <form class="form">' +
    '        <div class="field">' +
    '          <label class="label" for="donation-amount-input">후원 금액</label>' +
    '          <div class="chip-row"></div>' +
    '          <input class="amount-input" id="donation-amount-input" name="amount" type="number" inputmode="numeric" />' +
    '          <div class="hint amount-hint"></div>' +
    "        </div>" +
    '        <div class="field">' +
    '          <label class="label" for="donation-name-input">후원자 이름 (선택)</label>' +
    '          <input class="name-input" id="donation-name-input" name="supporterName" type="text" maxlength="40" placeholder="익명 후원자" />' +
    "        </div>" +
    '        <div class="field">' +
    '          <label class="label" for="donation-message-input">메시지 (선택)</label>' +
    '          <textarea class="message-input" id="donation-message-input" name="message" maxlength="120" placeholder="짧은 메시지를 남겨 보세요."></textarea>' +
    '          <div class="hint note-text"></div>' +
    "        </div>" +
    '        <p class="error" data-visible="false"></p>' +
    '        <div class="actions">' +
    '          <button class="ghost close-button" type="button">닫기</button>' +
    '          <button class="primary submit-button" type="submit"></button>' +
    "        </div>" +
    '        <p class="submit-note"></p>' +
    "      </form>" +
    "    </div>" +
    "  </div>" +
    "</section>";

  var badge = root.querySelector(".badge");
  var headline = root.querySelector(".headline");
  var description = root.querySelector(".description");
  var presetRow = root.querySelector(".preset-row");
  var openButton = root.querySelector(".open-button");
  var modal = root.querySelector(".modal-backdrop");
  var modalTitle = root.querySelector(".modal-title");
  var modalCopy = root.querySelector(".modal-copy");
  var chipRow = root.querySelector(".chip-row");
  var amountInput = root.querySelector(".amount-input");
  var amountHint = root.querySelector(".amount-hint");
  var nameInput = root.querySelector(".name-input");
  var messageInput = root.querySelector(".message-input");
  var errorBox = root.querySelector(".error");
  var noteText = root.querySelector(".note-text");
  var submitNote = root.querySelector(".submit-note");
  var submitButton = root.querySelector(".submit-button");
  var closeButtons = root.querySelectorAll(".close, .close-button");
  var form = root.querySelector(".form");
  var activeAmount = options.presets[0];

  function setError(message) {
    errorBox.textContent = message || "";
    errorBox.setAttribute("data-visible", message ? "true" : "false");
  }

  function setBusy(nextBusy) {
    busy = nextBusy;
    submitButton.disabled = nextBusy;
    for (var i = 0; i < closeButtons.length; i += 1) {
      closeButtons[i].disabled = nextBusy;
    }
    submitButton.textContent = nextBusy ? "결제 페이지 준비 중..." : options.checkoutText;
  }

  function syncAmountHint(value) {
    amountHint.textContent =
      "입력 가능 금액 " +
      formatMoney(options.minAmount, options.currency) +
      " ~ " +
      formatMoney(options.maxAmount, options.currency) +
      " / 현재 " +
      formatMoney(value, options.currency);
  }

  function syncPresetButtons(amount) {
    var buttons = chipRow.querySelectorAll(".chip");
    for (var i = 0; i < buttons.length; i += 1) {
      var buttonAmount = Number(buttons[i].getAttribute("data-amount"));
      buttons[i].setAttribute("data-active", buttonAmount === amount ? "true" : "false");
    }
  }

  function setAmount(nextAmount) {
    activeAmount = nextAmount;
    amountInput.value = String(nextAmount);
    syncPresetButtons(nextAmount);
    syncAmountHint(nextAmount);
    setError("");
  }

  function openModal() {
    modal.setAttribute("data-open", "true");
    previousBodyOverflow = document.body ? document.body.style.overflow : "";
    if (document.body) {
      document.body.style.overflow = "hidden";
    }
    sendTrackEvent("widget_open", {
      metadata: {
        source: "embed",
        projectId: options.projectId,
        campaign: options.campaign
      }
    });
    setTimeout(function () {
      amountInput.focus();
      amountInput.select();
    }, 0);
  }

  function closeModal() {
    if (busy) {
      return;
    }
    modal.setAttribute("data-open", "false");
    if (document.body) {
      document.body.style.overflow = previousBodyOverflow;
    }
    setError("");
  }

  function validateAmount(rawValue) {
    var amount = parseAmount(rawValue, 0);
    if (!amount || amount < options.minAmount || amount > options.maxAmount) {
      return null;
    }
    return amount;
  }

  async function createPayment(payload) {
    var sessionToken = await ensureRuntimeSession(false);
    var response = await fetch(options.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        embedSession: sessionToken
      })
    });

    if (response.status === 403) {
      sessionToken = await ensureRuntimeSession(true);
      response = await fetch(options.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          embedSession: sessionToken
        })
      });
    }

    var data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || "체크아웃을 생성하지 못했습니다.");
    }

    if (!data.checkoutUrl) {
      throw new Error("체크아웃 URL이 없습니다.");
    }

    return data.checkoutUrl;
  }

  badge.textContent = options.creator + " 후원";
  headline.textContent = options.headline;
  description.textContent = options.description;
  modalTitle.textContent = options.creator + " 후원하기";
  modalCopy.textContent = "내 백엔드가 체크아웃 세션을 만들고 후원 기록을 저장한 뒤 결제를 확정합니다.";
  openButton.textContent = options.buttonText;
  noteText.textContent = options.note;
  submitNote.textContent = "결제 완료 후 성공 페이지로 돌아오면 서버가 후원 내역을 최종 확정합니다.";
  submitButton.textContent = options.checkoutText;

  var presetPillsFragment = document.createDocumentFragment();
  var presetChipsFragment = document.createDocumentFragment();

  for (var presetIndex = 0; presetIndex < options.presets.length; presetIndex += 1) {
    var presetAmount = options.presets[presetIndex];
    var pill = createNode("span", "pill", formatMoney(presetAmount, options.currency));
    presetPillsFragment.appendChild(pill);

    var chip = createNode("button", "chip", formatMoney(presetAmount, options.currency));
    chip.type = "button";
    chip.setAttribute("data-amount", String(presetAmount));
    chip.addEventListener("click", (function (amount) {
      return function () {
        setAmount(amount);
      };
    })(presetAmount));
    presetChipsFragment.appendChild(chip);
  }

  presetRow.appendChild(presetPillsFragment);
  chipRow.appendChild(presetChipsFragment);

  amountInput.min = String(options.minAmount);
  amountInput.max = String(options.maxAmount);
  amountInput.step = "1000";
  setAmount(activeAmount);

  openButton.addEventListener("click", openModal);

  for (var closeIndex = 0; closeIndex < closeButtons.length; closeIndex += 1) {
    closeButtons[closeIndex].addEventListener("click", closeModal);
  }

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.getAttribute("data-open") === "true") {
      closeModal();
    }
  });

  amountInput.addEventListener("input", function () {
    var amount = validateAmount(amountInput.value);
    if (amount) {
      syncPresetButtons(amount);
      syncAmountHint(amount);
      setError("");
      return;
    }

    amountHint.textContent =
      "입력 가능 금액 " +
      formatMoney(options.minAmount, options.currency) +
      " ~ " +
      formatMoney(options.maxAmount, options.currency);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (busy) {
      return;
    }

    var amount = validateAmount(amountInput.value);
    if (!amount) {
      setError("후원 금액은 " + formatMoney(options.minAmount, options.currency) + "부터 " + formatMoney(options.maxAmount, options.currency) + " 사이여야 합니다.");
      amountInput.focus();
      return;
    }

    setBusy(true);
    setError("");

    try {
      flushEngagement("submit", false);

      var checkoutUrl = await createPayment({
        amount: amount,
        projectId: options.projectId,
        currency: options.currency,
        creator: options.creator,
        campaign: options.campaign,
        supporterName: nameInput.value.trim(),
        message: messageInput.value.trim(),
        method: options.method,
        autoApprove: options.autoApprove,
        visitorId: visitorId,
        sessionId: sessionId,
        host: window.location.host,
        pageUrl: pageUrl,
        pagePath: pagePath,
        referrer: document.referrer || ""
      });

      await new Promise(function (resolve) {
        setTimeout(resolve, 80);
      });
      window.location.assign(checkoutUrl);
    } catch (error) {
      setError(error.message || "체크아웃을 생성하지 못했습니다.");
      setBusy(false);
    }
  });
})();
