import Link from "next/link";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ticketr
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/support/new" className="text-gray-600 hover:text-gray-900">
              Submit request
            </Link>
            <Link href="/login" className="font-medium text-[#167E6C] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
