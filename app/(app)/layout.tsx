import Sidebar from "@/app/components/Sidebar";
import AuthProvider from "@/app/components/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Sidebar />
        <main className="ml-64">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}