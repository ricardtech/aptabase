import { Outlet } from "react-router-dom";
import { UpdateNotifier } from "@components/UpdateNotifier";

export function AuthenticationLayout() {
  return (
    <div className="flex min-h-full flex-col bg-muted md:justify-center py-12 px-4 lg:px-8">
      <UpdateNotifier />
      <Outlet />
    </div>
  );
}
