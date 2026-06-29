import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  HeartPulse,
  ClipboardList,
  Users,
  Smartphone,
  ArrowRight,
  Lock,
  AlertCircle,
  Stethoscope,
  CalendarCheck,
  ShieldCheck,
} from 'lucide-react';

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, login } = useAdmin();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminClick = () => {
    if (isAuthenticated) {
      navigate('/admin');
    } else {
      setShowLoginModal(true);
      setAdminKeyInput('');
      setLoginError('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) {
      setLoginError('Please enter the access key.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    const ok = await login(adminKeyInput.trim());
    setIsLoggingIn(false);
    if (ok) {
      setShowLoginModal(false);
      navigate('/admin');
    } else {
      setLoginError('Incorrect access key. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-foreground">AGA Health Foundation</p>
              <p className="text-xs text-muted-foreground leading-tight">Obuasi Mine, Ghana</p>
            </div>
          </div>
          <button
            onClick={handleAdminClick}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="w-4 h-4" />
            {isAuthenticated ? 'Go to Dashboard' : 'Admin Login'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/8 to-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full border border-primary/20 mb-2">
            <Stethoscope className="w-4 h-4" />
            Research Study — 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Telehealth Readiness<br className="hidden md:block" /> Survey
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Helping AGA Health Foundation understand how technology can improve healthcare access for mine employees and contractors at the Obuasi mine.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="px-8 h-13 text-base rounded-full shadow-md"
              onClick={() => navigate('/survey')}
            >
              Take the Survey <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Takes approximately 5–8 minutes. Fully anonymous.
          </p>
        </div>
      </section>

      {/* About the study */}
      <section className="max-w-4xl mx-auto px-6 py-14 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">About This Study</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This survey is part of a formal research project conducted by AGA Health Foundation to explore the feasibility and acceptance of telecare services among mine workers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: CalendarCheck,
              title: 'The Challenge',
              body: 'Many employees and contractors miss scheduled review and follow-up appointments due to demanding work schedules, travel distance, and time constraints — even when managing chronic conditions.',
            },
            {
              icon: Smartphone,
              title: 'The Opportunity',
              body: 'Telehealth (video consultations, phone follow-ups, and digital messaging) could bring quality healthcare directly to you — reducing the need to physically visit the clinic for every appointment.',
            },
            {
              icon: HeartPulse,
              title: 'Focus Areas',
              body: 'The study focuses on non-communicable diseases (NCDs) such as hypertension and diabetes, as well as routine review and follow-up visits, where telecare has the greatest potential impact.',
            },
            {
              icon: ShieldCheck,
              title: 'Your Data Is Safe',
              body: 'All responses are completely anonymous. No names or personal identifiers are collected. Data will be used solely for research purposes to improve healthcare services at AGA Obuasi.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6 space-y-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who should respond */}
      <section className="bg-muted/40 border-y">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Users className="w-5 h-5" />
                Who Should Complete This Survey?
              </div>
              <p className="text-muted-foreground leading-relaxed">
                This survey is intended for all <strong className="text-foreground">AGA Obuasi mine employees and contractors</strong> — regardless of whether you currently have a health condition. Your perspective on telehealth matters even if you are healthy.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'All employees and contractors at AGA Obuasi mine',
                  'People with and without existing health conditions',
                  'Those who have and have not used telehealth before',
                  'All departments and work areas',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 text-center space-y-4">
              <div className="inline-flex flex-col items-center gap-2 bg-card border rounded-2xl px-10 py-8 shadow-sm">
                <ClipboardList className="w-10 h-10 text-primary" />
                <p className="text-3xl font-bold text-foreground">8 Sections</p>
                <p className="text-sm text-muted-foreground">~5 to 8 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to Participate?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Your input will directly shape how AGA Health Foundation designs and delivers telehealth services for you and your colleagues.
        </p>
        <Button
          size="lg"
          className="px-10 h-13 text-base rounded-full shadow-md"
          onClick={() => navigate('/survey')}
        >
          Start the Survey <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>AGA Health Foundation — Obuasi Mine, Ghana</p>
          <p>Research Study &copy; 2026. All responses are anonymous.</p>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Admin Access
            </DialogTitle>
            <DialogDescription>
              Enter your research team access key to view survey responses.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="admin-key">Access Key</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter access key"
                value={adminKeyInput}
                onChange={e => setAdminKeyInput(e.target.value)}
                autoFocus
                className="h-11"
              />
              {loginError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowLoginModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoggingIn}>
                {isLoggingIn ? 'Verifying...' : 'Login'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
