import { useQuery } from '@tanstack/react-query';
import { platformConfig } from '@/platform/config';
import { PlatformFooter } from '@/platform/components/PlatformFooter';
import { StudyCard } from '@/platform/components/StudyCard';
import { fetchPublicStudies } from '@/platform/lib/api';

export default function PlatformLandingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-studies'],
    queryFn: fetchPublicStudies,
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground">{platformConfig.organization}</p>
          <h1 className="text-2xl font-semibold mt-1">Hospital Research Studies</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Research conducted at {platformConfig.location}. Surveys are anonymous unless a
            study page states otherwise.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {isLoading && <p className="text-muted-foreground">Loading studies…</p>}
        {error && (
          <p className="text-destructive">Could not load studies. Check that the API is running.</p>
        )}
        {data && data.studies.length === 0 && (
          <p className="text-muted-foreground">No studies are open right now.</p>
        )}
        {data && data.studies.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {data.studies.map((study) => (
              <StudyCard key={study.slug} study={study} />
            ))}
          </div>
        )}
      </main>

      <div className="max-w-5xl mx-auto px-4">
        <PlatformFooter />
      </div>
    </div>
  );
}
