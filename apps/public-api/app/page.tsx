export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
      <section className="w-full rounded-[28px] bg-white p-10 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#B79A18]">Public Runtime</p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">public-api</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          이 앱은 위젯이 호출하는 공개 API와 결제 복귀 페이지를 담당합니다. 서비스 허브와 관리자 화면은
          `dashboard-web`, 위젯 자산은 `widget-cdn`이 담당합니다.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#F7F4EC] p-4">
            <p className="text-xs font-bold text-gray-400">API</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">/api/embed/bootstrap</p>
            <p className="text-sm font-semibold text-gray-900">/api/create-payment</p>
            <p className="text-sm font-semibold text-gray-900">/api/track</p>
            <p className="text-sm font-semibold text-gray-900">/api/confirm-payment</p>
          </div>
          <div className="rounded-2xl bg-[#F7F4EC] p-4">
            <p className="text-xs font-bold text-gray-400">Checkout</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">/local-checkout</p>
            <p className="text-sm font-semibold text-gray-900">/success</p>
            <p className="text-sm font-semibold text-gray-900">/fail</p>
          </div>
          <div className="rounded-2xl bg-[#F7F4EC] p-4">
            <p className="text-xs font-bold text-gray-400">Role</p>
            <p className="mt-2 text-sm leading-6 text-gray-700">widget-cdn과 dashboard-web 사이의 공개 런타임 경계를 담당합니다.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
