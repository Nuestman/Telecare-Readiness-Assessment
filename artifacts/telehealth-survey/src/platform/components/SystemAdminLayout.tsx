import { Link } from 'wouter';
import { useSystemAdmin } from '@/platform/context/SystemAdminContext';
import { systemAdminPaths } from '@/platform/paths';
import { Button } from '@/components/ui/button';

export function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useSystemAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Platform administration</p>
            <p className="font-medium">{user?.name ?? user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={systemAdminPaths.dashboard}>Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={systemAdminPaths.health}>System health</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={systemAdminPaths.studies}>Studies</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
