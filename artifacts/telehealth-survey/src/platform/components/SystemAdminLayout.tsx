import { Link } from 'wouter';
import { useSystemAdmin } from '@/platform/context/SystemAdminContext';
import { systemAdminPaths } from '@/platform/paths';
import { platformVersionLabel } from '@/platform/version';
import { Button } from '@/components/ui/button';

export function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useSystemAdmin();

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Platform administration · {platformVersionLabel}
            </p>
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
            <Button asChild variant="outline" size="sm">
              <Link href={systemAdminPaths.prospectus}>Prospectuses</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>
      <footer className="border-t bg-card/50 py-3 text-center text-xs text-muted-foreground">
        AGA Health Foundation Research Platform {platformVersionLabel}
      </footer>
    </div>
  );
}
