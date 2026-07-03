import { Link } from 'wouter';
import { platformConfig } from '@/platform/config';
import { systemAdminPaths } from '@/platform/paths';

export function PlatformFooter() {
  return (
    <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground space-y-2">
      <div className="flex justify-center gap-4 flex-wrap">
        <a href={`mailto:${platformConfig.defaultContactEmail}`} className="hover:underline">
          Contact
        </a>
        <Link href={systemAdminPaths.login} className="hover:underline opacity-70">
          Platform administration
        </Link>
      </div>
      <p>© {platformConfig.organization}</p>
    </footer>
  );
}
