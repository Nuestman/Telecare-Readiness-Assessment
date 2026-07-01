import { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetStudyCollectionStatus } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  HeartPulse,
  ClipboardList,
  Users,
  Smartphone,
  ArrowRight,
  Stethoscope,
  CalendarCheck,
  ShieldCheck,
  Mail,
  FileText,
  Lock,
} from 'lucide-react';
import { studyPaths } from '@/studies/telehealth-readiness/paths';
import { telehealthStudyConfig as cfg } from '@/studies/telehealth-readiness/config';
import { AdminLoginForm } from '@/studies/telehealth-readiness/components/AdminLoginForm';
import { AdminRegisterLink } from '@/studies/telehealth-readiness/pages/AdminRegisterPage';

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { data: collectionStatus } = useGetStudyCollectionStatus();
  const [loginOpen, setLoginOpen] = useState(false);

  const surveyOpen = collectionStatus?.is_open !== false;

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    navigate(studyPaths.admin);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-foreground">{cfg.organization}</p>
              <p className="text-xs text-muted-foreground leading-tight">{cfg.location}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => setLoginOpen(true)}
          >
            <Lock className="w-4 h-4" />
            Research team login
          </Button>
        </div>
      </header>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Research Team Login</DialogTitle>
            <DialogDescription>
              Sign in to view survey responses and analytics for {cfg.shortTitle}.
            </DialogDescription>
          </DialogHeader>
          <AdminLoginForm
            onSuccess={handleLoginSuccess}
            showCancel
            onCancel={() => setLoginOpen(false)}
          />
          <AdminRegisterLink />
        </DialogContent>
      </Dialog>

      <section className="bg-gradient-to-b from-primary/8 to-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full border border-primary/20 mb-2">
            <Stethoscope className="w-4 h-4" />
            Research Study — {cfg.studyYear}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Telehealth Readiness<br className="hidden md:block" /> Survey
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Helping {cfg.organization} understand how technology can improve healthcare access for mine employees and contractors at the Obuasi mine.
          </p>
          {!surveyOpen && collectionStatus?.message && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 px-4 py-3 text-sm max-w-xl mx-auto">
              {collectionStatus.message}
            </div>
          )}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="px-8 h-13 text-base rounded-full shadow-md"
              disabled={!surveyOpen}
              onClick={() => navigate(studyPaths.survey)}
            >
              Take the Survey <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Takes approximately {cfg.estimatedMinutes} minutes. Fully anonymous.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-14 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">About This Study</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {cfg.fullTitle}. This survey is part of a formal research project conducted by {cfg.organization}.
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
              body: cfg.dataRetention,
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

        <div className="rounded-xl border bg-muted/30 p-6 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            Study information
          </div>
          <p><span className="font-medium text-foreground">Principal Investigator:</span> {cfg.principalInvestigator}</p>
          <p><span className="font-medium text-foreground">Ethics approval:</span> {cfg.ethicsReference}</p>
          <p className="flex items-center gap-2 flex-wrap">
            <Mail className="w-4 h-4" />
            <span>Questions: {cfg.contactEmail} · {cfg.contactPhone}</span>
          </p>
        </div>
      </section>

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
            </div>
            <div className="shrink-0 text-center space-y-4">
              <div className="inline-flex flex-col items-center gap-2 bg-card border rounded-2xl px-10 py-8 shadow-sm">
                <ClipboardList className="w-10 h-10 text-primary" />
                <p className="text-3xl font-bold text-foreground">8 Sections</p>
                <p className="text-sm text-muted-foreground">~{cfg.estimatedMinutes}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to Participate?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Your input will directly shape how AGA Health Foundation designs and delivers telehealth services for you and your colleagues.
        </p>
        <Button
          size="lg"
          className="px-10 h-13 text-base rounded-full shadow-md"
          disabled={!surveyOpen}
          onClick={() => navigate(studyPaths.survey)}
        >
          Start the Survey <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      <footer className="border-t bg-card mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{cfg.organization} — {cfg.location}</p>
          <p>Research Study &copy; {cfg.studyYear}. Ethics ref: {cfg.ethicsReference}</p>
        </div>
      </footer>
    </div>
  );
}
