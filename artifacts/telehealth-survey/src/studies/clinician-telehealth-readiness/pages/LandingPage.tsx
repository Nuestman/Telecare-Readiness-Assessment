import { useState } from "react";
import { useLocation } from "wouter";
import { useGetClinicianStudyCollectionStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Stethoscope,
  ClipboardList,
  Users,
  ArrowRight,
  ShieldCheck,
  Mail,
  FileText,
  Lock,
  HeartPulse,
} from "lucide-react";
import { studyPaths } from "@/studies/clinician-telehealth-readiness/paths";
import { clinicianStudyConfig as cfg } from "@/studies/clinician-telehealth-readiness/config";
import { AdminLoginForm } from "@/studies/telehealth-readiness/components/AdminLoginForm";
import { ClinicianAdminRegisterLink } from "@/studies/clinician-telehealth-readiness/pages/AdminRegisterPage";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { data: collectionStatus } = useGetClinicianStudyCollectionStatus();
  const [loginOpen, setLoginOpen] = useState(false);
  const surveyOpen = collectionStatus?.is_open !== false;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{cfg.organization}</p>
              <p className="text-xs text-muted-foreground leading-tight">{cfg.location}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setLoginOpen(true)}>
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
              Sign in to view clinician survey responses and analytics.
            </DialogDescription>
          </DialogHeader>
          <AdminLoginForm
            onSuccess={() => {
              setLoginOpen(false);
              navigate(studyPaths.admin);
            }}
            showCancel
            onCancel={() => setLoginOpen(false)}
          />
          <ClinicianAdminRegisterLink />
        </DialogContent>
      </Dialog>

      <section className="bg-gradient-to-b from-primary/8 to-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full border border-primary/20">
            <ClipboardList className="w-4 h-4" />
            Clinician study — {cfg.studyYear}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Clinician Telehealth<br className="hidden md:block" /> Readiness Survey
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help {cfg.organization} understand how clinical staff can deliver telehealth and telecare services at Obuasi.
          </p>
          {!surveyOpen && collectionStatus?.message && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm max-w-xl mx-auto">
              {collectionStatus.message}
            </div>
          )}
          <Button
            size="lg"
            className="px-8 rounded-full shadow-md"
            disabled={!surveyOpen}
            onClick={() => navigate(studyPaths.survey)}
          >
            Take the survey <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            ~{cfg.estimatedMinutes} minutes. Confidential — no names collected.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-14 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">About this study</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{cfg.fullTitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: HeartPulse,
              title: "Clinical arm",
              body: "Complements the community telehealth readiness survey by measuring staff readiness to deliver virtual care.",
            },
            {
              icon: ShieldCheck,
              title: "Confidential",
              body: cfg.dataRetention,
            },
            {
              icon: Users,
              title: "Who should participate",
              body: "Doctors, nurses, midwives, and allied health staff at AGA Health Foundation.",
            },
            {
              icon: Stethoscope,
              title: "Focus",
              body: "Self-efficacy, workflow fit, facility enablers, barriers, training needs, and willingness to deliver telecare.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            Study information
          </div>
          <p>PI: {cfg.principalInvestigator}</p>
          <p>Ethics: {cfg.ethicsReference}</p>
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {cfg.contactEmail} · {cfg.contactPhone}
          </p>
        </div>
      </section>
    </div>
  );
}
