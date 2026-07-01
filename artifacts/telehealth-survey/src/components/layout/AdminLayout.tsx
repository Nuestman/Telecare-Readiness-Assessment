import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, HeartPulse, LogOut, Share2, Check, Copy, ExternalLink, FileBarChart, Users } from "lucide-react";
import QRCode from "qrcode";
import { useAdmin } from "@/context/AdminContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { studyPaths, surveyPublicUrl } from "@/studies/telehealth-readiness/paths";

function ShareLinkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const surveyUrl = surveyPublicUrl();

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(surveyUrl, { width: 200, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [open, surveyUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = surveyUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Share Survey Link
          </DialogTitle>
          <DialogDescription>
            Share this link or QR code with AGA Obuasi mine employees and contractors.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {qrDataUrl && (
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="Survey QR code" className="rounded-lg border" />
            </div>
          )}
          <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3 border">
            <span className="text-sm text-foreground flex-1 break-all font-mono">{surveyUrl}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => window.open(surveyUrl, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button className="flex-1" onClick={handleCopy}>
              {copied ? <><Check className="w-4 h-4 mr-2" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Link</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAdmin();
  const [showShare, setShowShare] = useState(false);
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate(studyPaths.adminLogin);
  };

  const navClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
      location === path
        ? 'bg-primary text-primary-foreground font-medium shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-r md:border-b-0 bg-card flex flex-col shrink-0">
        <div className="p-6 border-b flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-primary shrink-0" />
          <div>
            <h1 className="font-heading font-bold text-lg text-foreground leading-tight">AGA Health</h1>
            <p className="text-muted-foreground text-sm">{user?.name ?? 'Research Dashboard'}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex gap-2 md:flex-col overflow-x-auto">
          <Link href={studyPaths.admin}>
            <div className={navClass(studyPaths.admin)}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Dashboard
            </div>
          </Link>
          <Link href={studyPaths.adminReport}>
            <div className={navClass(studyPaths.adminReport)}>
              <FileBarChart className="w-4 h-4 shrink-0" />
              Pilot Report
            </div>
          </Link>
          {user?.role === 'admin' && (
            <Link href={studyPaths.adminUsers}>
              <div className={navClass(studyPaths.adminUsers)}>
                <Users className="w-4 h-4 shrink-0" />
                Users
              </div>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-primary border-primary/30 hover:bg-primary/5"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="w-4 h-4" />
            Share Survey Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>

      <ShareLinkModal open={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}
