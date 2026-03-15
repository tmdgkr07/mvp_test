(function () {
  var script = document.currentScript;

  if (!script) {
    return;
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

  function readOption(name) {
    var attr = script.getAttribute(
      "data-" +
        name.replace(/[A-Z]/g, function (char) {
          return "-" + char.toLowerCase();
        })
    );

    return attr !== null && attr !== "" ? attr : "";
  }

  function collectDataAttributes() {
    var attrs = {};

    for (var index = 0; index < script.attributes.length; index += 1) {
      var attribute = script.attributes[index];
      if (!attribute || !attribute.name || attribute.name.indexOf("data-") !== 0) {
        continue;
      }

      if (attribute.name === "data-target") {
        continue;
      }

      attrs[attribute.name] = attribute.value;
    }

    return attrs;
  }

  function buildApiBaseUrl() {
    var configured = String(readOption("apiBase") || "").trim();
    if (configured) {
      return configured;
    }

    return new URL(script.src, window.location.href).origin;
  }

  function normalizeLauncherStyle(value) {
    var style = String(value || "").trim().toLowerCase();
    if (style === "icon" || style === "pill" || style === "mini" || style === "custom") {
      return style;
    }
    return "pill";
  }

  function isVersionedV1() {
    try {
      return /\/v1\/widget\.js$/i.test(new URL(script.src, window.location.href).pathname);
    } catch (error) {
      return false;
    }
  }

  function placeMount(node) {
    var target = String(readOption("target") || "").trim();
    if (target) {
      var targetNode = document.querySelector(target);
      if (targetNode) {
        targetNode.appendChild(node);
        return;
      }
    }

    if (script.parentNode && String(script.parentNode.tagName || "").toUpperCase() !== "HEAD") {
      script.insertAdjacentElement("afterend", node);
      return;
    }

    if (document.body) {
      document.body.appendChild(node);
      return;
    }

    window.addEventListener(
      "DOMContentLoaded",
      function () {
        document.body.appendChild(node);
      },
      { once: true }
    );
  }

  var apiBaseUrl = buildApiBaseUrl();
  var launcherStyle = normalizeLauncherStyle(readOption("launcherStyle"));
  var iframeOrigin = new URL(apiBaseUrl, window.location.href).origin;
  var channelId = randomId("babjuseyo-frame");
  var frameUrl = new URL("/embed/widget", apiBaseUrl);
  frameUrl.searchParams.set("channel", channelId);
  if (isVersionedV1()) {
    frameUrl.searchParams.set("runtime", "v1");
  }

  var mount = document.createElement("div");
  mount.style.width = launcherStyle === "icon" ? "80px" : launcherStyle === "pill" ? "220px" : "420px";
  mount.style.maxWidth = launcherStyle === "icon" ? "80px" : launcherStyle === "pill" ? "220px" : "420px";
  mount.style.minHeight = launcherStyle === "icon" ? "80px" : launcherStyle === "pill" ? "64px" : "220px";
  mount.style.position = "relative";

  var iframe = document.createElement("iframe");
  iframe.src = frameUrl.toString();
  iframe.loading = "lazy";
  iframe.title = "Babjuseyo support widget";
  iframe.setAttribute("scrolling", "no");
  iframe.style.width = "100%";
  iframe.style.height = launcherStyle === "icon" ? "80px" : launcherStyle === "pill" ? "64px" : "220px";
  iframe.style.border = "0";
  iframe.style.borderRadius = "28px";
  iframe.style.background = "transparent";
  iframe.style.display = "block";
  iframe.style.overflow = "hidden";
  iframe.style.opacity = "0";
  iframe.style.transition = "height 180ms ease, opacity 180ms ease";
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-top-navigation-by-user-activation"
  );

  mount.appendChild(iframe);
  placeMount(mount);

  var previousBodyOverflow = "";

  function applyClosedLayout(closedHeight, closedWidth) {
    var minClosedHeight = launcherStyle === "icon" ? 80 : launcherStyle === "pill" ? 64 : 180;
    mount.style.position = "relative";
    mount.style.inset = "";
    mount.style.zIndex = "";
    mount.style.width = Math.max(80, Math.min(closedWidth || (launcherStyle === "icon" ? 80 : launcherStyle === "pill" ? 220 : 420), 560)) + "px";
    mount.style.height = "auto";
    mount.style.maxWidth = Math.max(80, Math.min(closedWidth || (launcherStyle === "icon" ? 80 : launcherStyle === "pill" ? 220 : 420), 560)) + "px";
    mount.style.minHeight = Math.max(64, Math.min(closedHeight || (launcherStyle === "icon" ? 80 : launcherStyle === "pill" ? 64 : 220), 420)) + "px";
    mount.style.display = "block";
    mount.style.alignItems = "";
    mount.style.justifyContent = "";
    mount.style.padding = "";
    mount.style.background = "";
    mount.style.backdropFilter = "";

    iframe.style.width = "100%";
    iframe.style.maxWidth = "";
    iframe.style.height = Math.max(minClosedHeight, Math.min(closedHeight || (launcherStyle === "icon" ? 80 : launcherStyle === "pill" ? 64 : 220), 420)) + "px";
    iframe.style.maxHeight = "";
    iframe.style.borderRadius = "28px";
    iframe.style.boxShadow = "";
    iframe.style.opacity = "1";

    if (document.body) {
      document.body.style.overflow = previousBodyOverflow;
    }
  }

  function applyOpenLayout() {
    if (document.body) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    mount.style.position = "fixed";
    mount.style.inset = "0";
    mount.style.zIndex = "2147483646";
    mount.style.width = "100vw";
    mount.style.height = "100vh";
    mount.style.maxWidth = "none";
    mount.style.minHeight = "100vh";
    mount.style.display = "flex";
    mount.style.alignItems = "center";
    mount.style.justifyContent = "center";
    mount.style.padding = "16px";
    mount.style.background = "rgba(26, 26, 26, 0.38)";
    mount.style.backdropFilter = "blur(8px)";

    iframe.style.width = "100%";
    iframe.style.maxWidth = "592px";
    iframe.style.height = "100%";
    iframe.style.maxHeight = "calc(100vh - 32px)";
    iframe.style.borderRadius = "32px";
    iframe.style.boxShadow = "0 32px 84px rgba(26, 26, 26, 0.24)";
    iframe.style.opacity = "1";
  }

  function sendFrameConfig() {
    if (!iframe.contentWindow) {
      return;
    }

    var attrs = collectDataAttributes();
    attrs["data-parent-origin"] = window.location.origin;
    attrs["data-embed-origin"] = window.location.origin;
    attrs["data-page-path"] = window.location.pathname + window.location.search + window.location.hash;
    attrs["data-page-url"] = window.location.href;

    iframe.contentWindow.postMessage(
      {
        type: "babjuseyo:frame-config",
        channelId: channelId,
        attrs: attrs
      },
      iframeOrigin
    );
  }

  function applyFrameState(state, closedHeight, closedWidth) {
    if (state === "open") {
      applyOpenLayout();
      return;
    }

    applyClosedLayout(closedHeight, closedWidth);
  }

  iframe.addEventListener("load", function () {
    window.setTimeout(sendFrameConfig, 40);
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== iframeOrigin || event.source !== iframe.contentWindow) {
      return;
    }

    var data = event.data || {};
    if (data.type !== "babjuseyo:widget-frame" || data.channelId !== channelId) {
      return;
    }

    if (data.event === "shell-ready") {
      sendFrameConfig();
      return;
    }

    if (data.event === "state") {
      applyFrameState(String(data.state || "closed"), Number(data.closedHeight || 220), Number(data.closedWidth || 420));
      return;
    }

    if (data.event === "checkout" && typeof data.checkoutUrl === "string" && data.checkoutUrl) {
      window.location.assign(data.checkoutUrl);
    }
  });
})();
