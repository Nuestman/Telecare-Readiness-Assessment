import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, HeartPulse } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-r md:border-b-0 bg-card flex flex-col shrink-0">
        <div className="p-6 border-b flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-primary shrink-0" />
          <h1 className="font-heading font-bold text-lg text-foreground leading-tight">
            AGA Health
            <br />
            <span className="text-muted-foreground text-sm font-normal">Foundation</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 flex gap-2 md:flex-col overflow-x-auto">
          <Link href="/admin">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors whitespace-nowrap cursor-pointer ${location === '/admin' ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Dashboard
            </div>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
