import { Link } from 'wouter';
import { PlatformFooter } from '@/platform/components/PlatformFooter';
import { prospectusPaths } from '@/platform/paths';
import { Button } from '@/components/ui/button';

export default function ProspectusLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground">AGA Health Foundation Research</p>
          <h1 className="text-2xl font-semibold mt-1">Research prospectus</h1>
          <p className="text-muted-foreground mt-3">
            Every new study begins with a prospectus — a structured plan covering your research
            question, methodology, ethics, and timeline. After dual approval from research
            leadership and platform operations, your study can be provisioned on this platform.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <section className="rounded-lg border bg-card p-6 space-y-3">
          <h2 className="font-medium">What you will provide</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Working title and research problem</li>
            <li>Aims, objectives, and literature overview</li>
            <li>Proposed methodology and significance</li>
            <li>Ethics notes and data handling plan</li>
            <li>Timeline and preliminary references</li>
            <li>Optional supporting documents (PDF / Word)</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={prospectusPaths.new}>Start a prospectus</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to studies</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Save your tracking link after starting — you can return anytime to complete all sections.
        </p>
      </main>

      <div className="max-w-3xl mx-auto px-4">
        <PlatformFooter />
      </div>
    </div>
  );
}
