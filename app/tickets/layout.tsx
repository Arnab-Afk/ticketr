import { AppNav } from "@/components/layout/app-nav";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <AppNav />
      {children}
    </div>
  );
}
