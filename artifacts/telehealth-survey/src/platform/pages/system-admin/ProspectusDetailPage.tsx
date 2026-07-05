import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { useState } from 'react';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import {
  addProspectusReview,
  fetchSystemProspectusDetail,
  provisionStudyFromProspectus,
  recordProspectusApproval,
} from '@/platform/lib/prospectus-api';
import { formatBytes } from '@/platform/lib/prospectus-form';
import { systemAdminPaths } from '@/platform/paths';
import type { ProspectusPublic } from '@/platform/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ROLE_LABELS: Record<string, string> = {
  research_leadership: 'Research leadership',
  platform_ops: 'Platform operations',
};

export default function ProspectusDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reviewComments, setReviewComments] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [provisionSlug, setProvisionSlug] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['system-prospectus', id],
    queryFn: () => fetchSystemProspectusDetail(id),
    enabled: Number.isFinite(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['system-prospectus', id] });
    queryClient.invalidateQueries({ queryKey: ['system-prospectus'] });
  };

  const reviewMutation = useMutation({
    mutationFn: (decision: 'comment' | 'revision_requested') =>
      addProspectusReview(id, { decision, comments: reviewComments }),
    onSuccess: () => {
      setReviewComments('');
      invalidate();
      toast({ title: 'Review recorded' });
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const approvalMutation = useMutation({
    mutationFn: (args: {
      approvalRole: 'research_leadership' | 'platform_ops';
      decision: 'approved' | 'rejected';
    }) => recordProspectusApproval(id, { ...args, comments: approvalComments || undefined }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Decision recorded' });
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const provisionMutation = useMutation({
    mutationFn: () =>
      provisionStudyFromProspectus(id, {
        slug: provisionSlug.trim() || undefined,
      }),
    onSuccess: (result) => {
      invalidate();
      toast({ title: 'Study provisioned', description: result.message });
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }),
  });

  const prospectus = data?.prospectus;
  const status = prospectus?.status ?? '';
  const canReview = ['submitted', 'under_review', 'revision_requested'].includes(status);

  return (
    <SystemAdminLayout>
      <div className="mb-6 flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={systemAdminPaths.prospectus}>← Queue</Link>
        </Button>
        {status && <Badge variant="outline">{status}</Badge>}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">Could not load prospectus.</p>}

      {prospectus && (
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-semibold">{prospectus.title || 'Untitled'}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {prospectus.submitterName} · {prospectus.submitterEmail} · PI:{' '}
              {prospectus.principalInvestigator}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{prospectus.publicId}</p>
          </header>

          <DualApprovalPanel prospectus={prospectus} canReview={canReview} onApprove={approvalMutation.mutate} />

          {canReview && (
            <section className="rounded-lg border p-4 space-y-3">
              <h2 className="font-medium">Review feedback</h2>
              <Textarea
                rows={3}
                placeholder="Comments to the submitter (required for revision request)"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!reviewComments.trim() || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate('comment')}
                >
                  Add comment
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!reviewComments.trim() || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate('revision_requested')}
                >
                  Request revision
                </Button>
              </div>
              <Textarea
                rows={2}
                placeholder="Optional note attached to approval/rejection decisions"
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            </section>
          )}

          {status === 'approved' && !prospectus.linkedStudySlug && (
            <section className="rounded-lg border p-4 space-y-3">
              <h2 className="font-medium">Provision study</h2>
              <div>
                <Label htmlFor="slug">Study slug (editable)</Label>
                <Input
                  id="slug"
                  placeholder={prospectus.proposedSlug ?? 'my-study-slug'}
                  value={provisionSlug}
                  onChange={(e) => setProvisionSlug(e.target.value)}
                />
              </div>
              <Button size="sm" disabled={provisionMutation.isPending} onClick={() => provisionMutation.mutate()}>
                Create draft study registry row
              </Button>
            </section>
          )}

          {prospectus.linkedStudySlug && (
            <p className="text-sm">
              Linked study:{' '}
              <Link href={systemAdminPaths.studyEdit(prospectus.linkedStudySlug)} className="underline">
                {prospectus.linkedStudySlug}
              </Link>
            </p>
          )}

          {prospectus.attachments && prospectus.attachments.length > 0 && (
            <section>
              <h2 className="font-medium mb-2">Attachments</h2>
              <ul className="space-y-2">
                {prospectus.attachments.map((a) => (
                  <li key={a.id} className="text-sm flex justify-between gap-2 border rounded-md px-3 py-2">
                    <span>
                      {a.filename}{' '}
                      <span className="text-muted-foreground">({formatBytes(a.sizeBytes)})</span>
                    </span>
                    {a.downloadUrl && (
                      <a href={a.downloadUrl} target="_blank" rel="noreferrer" className="underline text-primary">
                        Download
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.reviews.length > 0 && (
            <section>
              <h2 className="font-medium mb-2">Review history</h2>
              <ul className="space-y-2 text-sm">
                {data.reviews.map((r) => (
                  <li key={r.id} className="border rounded-md p-3">
                    <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                    <span className="mx-2">·</span>
                    <span>{r.decision}</span>
                    {r.comments && <p className="mt-1">{r.comments}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ProspectusFullDetail prospectus={prospectus} />
        </div>
      )}
    </SystemAdminLayout>
  );
}

function DualApprovalPanel({
  prospectus,
  canReview,
  onApprove,
}: {
  prospectus: ProspectusPublic;
  canReview: boolean;
  onApprove: (args: {
    approvalRole: 'research_leadership' | 'platform_ops';
    decision: 'approved' | 'rejected';
  }) => void;
}) {
  return (
    <section className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">Dual approval</h2>
      {prospectus.approvals.map((slot) => (
        <div key={slot.role} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>{ROLE_LABELS[slot.role] ?? slot.role}</span>
          <Badge variant={slot.decision === 'approved' ? 'default' : 'outline'}>
            {slot.decision ?? 'pending'}
          </Badge>
        </div>
      ))}
      {canReview && (
        <div className="flex flex-wrap gap-2 pt-2">
          {(['research_leadership', 'platform_ops'] as const).flatMap((role) => [
            <Button key={`${role}-approve`} size="sm" variant="outline" onClick={() => onApprove({ approvalRole: role, decision: 'approved' })}>
              Approve ({ROLE_LABELS[role]})
            </Button>,
            <Button key={`${role}-reject`} size="sm" variant="destructive" onClick={() => onApprove({ approvalRole: role, decision: 'rejected' })}>
              Reject ({ROLE_LABELS[role]})
            </Button>,
          ])}
        </div>
      )}
    </section>
  );
}

function ProspectusFullDetail({ prospectus }: { prospectus: ProspectusPublic }) {
  const fields: { label: string; value: string | string[] }[] = [
    { label: 'Background', value: prospectus.background },
    { label: 'Research problem', value: prospectus.researchProblem },
    { label: 'Aims', value: prospectus.aims },
    { label: 'Literature', value: prospectus.literatureOverview },
    { label: 'Significance', value: prospectus.significance },
    { label: 'Ethics', value: prospectus.ethicsNotes },
    { label: 'Methodology design', value: prospectus.methodology.design },
    { label: 'Population', value: prospectus.methodology.population },
    { label: 'References', value: prospectus.referencesText },
  ];

  return (
    <section className="space-y-4">
      <h2 className="font-medium">Full submission</h2>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <span className="text-muted-foreground">Study type</span>
          <p>{prospectus.studyType}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Template</span>
          <p>{prospectus.studyTemplate}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Proposed slug</span>
          <p>{prospectus.proposedSlug ?? '—'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Identifiable data</span>
          <p>{prospectus.identifiableData ? 'Yes' : 'No'}</p>
        </div>
      </div>
      {fields.map((f) =>
        typeof f.value === 'string' && f.value.trim() ? (
          <div key={f.label}>
            <h3 className="text-sm font-medium text-muted-foreground">{f.label}</h3>
            <p className="text-sm whitespace-pre-wrap mt-1">{f.value}</p>
          </div>
        ) : null,
      )}
      {prospectus.researchQuestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Research questions</h3>
          <ul className="list-disc pl-5 text-sm mt-1">
            {prospectus.researchQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
