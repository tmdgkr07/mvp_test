import type { ReactNode } from "react";
import MarketingFooter from "@/components/MarketingFooter";
import Navbar from "@/components/Navbar";

export default function MarketingShell({
  children,
  showFooter = true
}: {
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main>{children}</main>
      {showFooter ? <MarketingFooter /> : null}
    </div>
  );
}
