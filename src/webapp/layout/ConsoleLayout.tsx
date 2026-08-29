import { TrialReminder } from "@features/billing";
import { PwaPrompt } from "@components/PwaPrompt";
import { AppSelector } from "../features/apps";
import { useAuthState } from "../features/auth";
import { MobileSidebar, NavMenu, UserMenu } from "../features/navigation";
import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { APP_VERSION, COMPANY_NAME, COPYRIGHT_YEAR } from "../version";

export function ConsoleLayout() {
  const auth = useAuthState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!auth.user) {
    return <Navigate to="/auth" replace={true} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileSidebar open={sidebarOpen} onClose={setSidebarOpen} />
      <PwaPrompt />

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r bg-card/30">
          <div className="flex justify-between items-center p-3 border-b">
            <AppSelector />
          </div>
          <div className="p-3 flex flex-grow flex-col mt-2">
            <NavMenu />
          </div>
          <div className="p-3 space-y-2 border-t">
            <TrialReminder />
            <UserMenu user={auth.user} />
            <div className="text-[11px] text-muted-foreground/60 text-center pt-1 font-mono">
              &copy; {COPYRIGHT_YEAR} {COMPANY_NAME} &middot; {APP_VERSION}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar for mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background/95 backdrop-blur px-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <MobileSidebar.Button onClick={() => setSidebarOpen(true)} />
            <div className="min-w-0 flex-1 max-w-[200px] xs:max-w-[250px]">
              <AppSelector />
            </div>
          </div>
          <div className="flex items-center pl-2 flex-shrink-0">
            <UserMenu user={auth.user} />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 mx-auto w-full max-w-6xl overflow-x-hidden flex flex-col justify-between">
          <div>
            <Outlet />
          </div>
          <footer className="py-6 text-center text-xs text-muted-foreground/50 border-t mt-12">
            &copy; {COPYRIGHT_YEAR} {COMPANY_NAME} &middot; Telemetria &amp; M&eacute;tricas &middot; <strong className="text-foreground/70">{APP_VERSION}</strong>
          </footer>
        </main>
      </div>
    </div>
  );
}
