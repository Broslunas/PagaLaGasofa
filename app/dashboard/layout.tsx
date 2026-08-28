import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="flex flex-1">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4 py-8 md:py-12">
        <div className="flex w-full max-w-xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
