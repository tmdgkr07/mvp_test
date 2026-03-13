import type { Metadata } from "next";
import EmbedWidgetFrameClient from "@/components/EmbedWidgetFrameClient";

export const metadata: Metadata = {
  title: "Embedded Support Widget",
  robots: {
    index: false,
    follow: false
  }
};

type EmbedWidgetPageProps = {
  searchParams: Promise<{
    channel?: string;
    runtime?: string;
  }>;
};

function sanitizeChannel(value: string | undefined) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);
}

export default async function EmbedWidgetPage({ searchParams }: EmbedWidgetPageProps) {
  const { channel = "", runtime = "" } = await searchParams;
  const channelId = sanitizeChannel(channel) || "babjuseyo-frame";
  const runtimePath = runtime === "v1" ? "/v1/widget-runtime.js" : "/widget-runtime.js";

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: transparent;
          overflow: hidden;
        }
      `}</style>
      <EmbedWidgetFrameClient channelId={channelId} runtimePath={runtimePath} />
    </>
  );
}
