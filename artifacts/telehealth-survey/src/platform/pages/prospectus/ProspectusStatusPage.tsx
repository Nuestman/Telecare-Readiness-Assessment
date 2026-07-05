import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { PlatformFooter } from '@/platform/components/PlatformFooter';
import { ProspectusReadOnlyView } from '@/platform/components/prospectus/ProspectusReadOnlyView';
import { ProspectusWizard } from '@/platform/components/prospectus/ProspectusWizard';
import { fetchProspectus } from '@/platform/lib/prospectus-api';
import { prospectusPaths } from '@/platform/paths';
import { isProspectusEditable } from '@/platform/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ProspectusStatusPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId ?? '';
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['prospectus', publicId],
    queryFn: () => fetchProspectus(publicId),
    enabled: Boolean(publicId),
  });

  const editable = data ? isProspectusEditable(data.status) : false;
  const isDraft = data?.status === 'draft';
  const isRevision = data?.status === 'revision_requested';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{data?.title || 'Research prospectus'}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.submitterName} · {data?.submitterEmail}
              </p>
            </div>
            {data && <Badge variant="outline">{data.status}</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Tracking link — bookmark this page</span>
            <CopyLinkButton publicId={publicId} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">Could not load prospectus.</p>}

        {data && !isDraft && (
          <ProspectusReadOnlyView data={data} showEditHint={isRevision} />
        )}

        {data && editable && (
          <div>
            {isRevision && <h2 className="text-lg font-semibold mb-4">Revise and resubmit</h2>}
            <ProspectusWizard
              key={data.publicId}
              initialData={data}
              onSubmitted={(updated) => {
                queryClient.setQueryData(['prospectus', publicId], updated);
              }}
            />
          </div>
        )}
      </main>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href={prospectusPaths.landing}>← Prospectus home</Link>
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <PlatformFooter />
      </div>
    </div>
  );
}

function CopyLinkButton({ publicId }: { publicId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(window.location.origin + prospectusPaths.status(publicId));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}
