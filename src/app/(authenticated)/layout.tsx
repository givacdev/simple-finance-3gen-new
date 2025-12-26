import Sidebar from '@/app/components/Sidebar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}