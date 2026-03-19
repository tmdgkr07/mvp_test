"use client";

import { useEffect, useRef, useState } from "react";

type EmbedWidgetFrameClientProps = {
  channelId: string;
  runtimePath: string;
};

type FrameConfigMessage = {
  attrs?: Record<string, unknown>;
  channelId?: string;
  type?: string;
};

function isSafeDataAttribute(name: string) {
  return /^data-[a-z0-9-]+$/.test(name);
}

export default function EmbedWidgetFrameClient({ channelId, runtimePath }: EmbedWidgetFrameClientProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function notifyShellReady() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "babjuseyo:widget-frame",
            event: "shell-ready",
            channelId
          },
          "*"
        );
      }
    }

    function handleMessage(event: MessageEvent<FrameConfigMessage>) {
      const payload = event.data;
      if (!payload || payload.type !== "babjuseyo:frame-config" || payload.channelId !== channelId) {
        return;
      }

      if (initializedRef.current || !mountRef.current) {
        return;
      }

      const script = document.createElement("script");
      script.src = runtimePath;
      script.async = true;

      const attrs = payload.attrs || {};
      for (const [key, rawValue] of Object.entries(attrs)) {
        if (!isSafeDataAttribute(key) || typeof rawValue !== "string") {
          continue;
        }

        script.setAttribute(key, rawValue);
      }

      script.setAttribute("data-embedded-frame", "true");
      script.setAttribute("data-parent-origin", event.origin);
      script.setAttribute("data-frame-channel", channelId);

      mountRef.current.appendChild(script);
      initializedRef.current = true;
      setReady(true);
    }

    notifyShellReady();
    const readyTimeout = window.setTimeout(notifyShellReady, 120);
    window.addEventListener("message", handleMessage);

    return () => {
      window.clearTimeout(readyTimeout);
      window.removeEventListener("message", handleMessage);
    };
  }, [channelId, runtimePath]);

  return (
    <main className="min-h-[220px] w-full bg-transparent px-3 py-3">
      <div ref={mountRef} className="w-full" />
      {!ready ? (
        <div className="rounded-[28px] bg-[linear-gradient(135deg,#fff1d6_0%,#ffc9a9_48%,#ff9f7a_100%)] p-5 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
          <div className="rounded-[22px] bg-white/80 p-5">
            <div className="h-4 w-24 rounded-full bg-black/10" />
            <div className="mt-4 h-8 w-3/4 rounded-2xl bg-black/10" />
            <div className="mt-3 h-4 w-full rounded-full bg-black/10" />
            <div className="mt-2 h-4 w-5/6 rounded-full bg-black/10" />
            <div className="mt-5 h-12 w-40 rounded-full bg-black/10" />
          </div>
        </div>
      ) : null}
    </main>
  );
}
