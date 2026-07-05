import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchSystemProspectuses } from '@/platform/lib/prospectus-api';
import { systemAdminPaths } from '@/platform/paths';
import type { ProspectusStatus } from '@/platform/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const FILTERS: { label: string; value?: ProspectusStatus }[] = [
  { label: 'All' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Revision', value: 'revision_requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function ProspectusQueuePage() {
  const [filter, setFilter] = useState<ProspectusStatus | undefined>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['system-prospectus', filter ?? 'all'],
    queryFn: () => fetchSystemProspectuses(filter),
  });

  return (
    <SystemAdminLayout>
      <h1 className="text-2xl font-semibold mb-2">Research prospectuses</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Dual approval required: research leadership and platform operations.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">Could not load prospectuses.</p>}

      <div className="space-y-3">
        {data?.prospectuses.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{p.title || 'Untitled'}</p>
                <p className="text-sm text-muted-foreground">
                  {p.submitterName} · {p.principalInvestigator}
                </p>
                {p.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(p.submittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{p.status}</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link href={systemAdminPaths.prospectusDetail(p.id)}>Review</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {data && data.prospectuses.length === 0 && (
          <p className="text-muted-foreground">No prospectuses match this filter.</p>
        )}
      </div>
    </SystemAdminLayout>
  );
}
