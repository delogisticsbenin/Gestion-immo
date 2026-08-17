import Sidebar from "@/app/components/Sidebar";
import AuthProvider from "@/app/components/AuthProvider";
import Toasts from "@/app/components/Toasts";
import GardePages from "@/app/components/GardePages";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <Toasts />
        <main className="flex-1 ml-64 min-h-screen bg-gray-100">
          <GardePages>{children}</GardePages>
        </main>
      </div>
    </AuthProvider>
  );
}