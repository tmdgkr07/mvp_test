import { headers } from "next/headers";
import { buildWidgetAssetUrl } from "@mvp-platform/shared/runtime";

async function buildBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3100";
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

function buildSnippet(baseUrl: string) {
  return [
    "<script",
    `  src="${buildWidgetAssetUrl(baseUrl)}"`,
    '  data-bootstrap-path="https://your-public-api.vercel.app/api/embed/bootstrap"',
    '  data-api-path="https://your-public-api.vercel.app/api/create-payment"',
    '  data-tracking-path="https://your-public-api.vercel.app/api/track"',
    '  data-project-id="your-project-id"',
    '  data-bootstrap-token="issued-by-dashboard-web"',
    "  async",
    "></script>"
  ].join("\n");
}

export default async function HomePage() {
  const baseUrl = await buildBaseUrl();
  const widgetUrl = buildWidgetAssetUrl(baseUrl);
  const versionedWidgetUrl = buildWidgetAssetUrl(baseUrl, "versioned");

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="eyebrow">Embed Runtime</div>
        <h1>widget-cdn</h1>
        <p>
          외부 서비스에 붙는 <code>widget.js</code>만 별도로 배포하는 앱입니다. 실제 후원 생성, 트래킹, 결제 확인은
          <code>public-api</code>, 서비스 허브와 관리자 화면은 <code>dashboard-web</code>이 담당합니다.
        </p>
        <div className="url-grid">
          <article>
            <span>Current</span>
            <strong>{widgetUrl}</strong>
          </article>
          <article>
            <span>Versioned</span>
            <strong>{versionedWidgetUrl}</strong>
          </article>
        </div>
      </section>

      <section className="info-grid">
        <article className="panel">
          <h2>운영 방식</h2>
          <ul>
            <li>외부 사이트에는 widget-cdn의 widget.js만 붙입니다.</li>
            <li>후원 생성과 이벤트 수집은 public-api URL로 다시 보냅니다.</li>
            <li>문제가 생기면 위젯 자산만 빠르게 교체하거나 롤백할 수 있습니다.</li>
          </ul>
        </article>

        <article className="panel">
          <h2>기본 스니펫</h2>
          <pre>{buildSnippet(baseUrl)}</pre>
        </article>
      </section>
    </main>
  );
}
