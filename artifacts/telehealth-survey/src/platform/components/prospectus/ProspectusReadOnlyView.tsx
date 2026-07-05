import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prospectusPaths } from '@/platform/paths';
import { formatCoInvestigator } from '@/platform/lib/prospectus-form';
import type { ProspectusPublic } from '@/platform/lib/types';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted — awaiting review',
  under_review: 'Under review',
  revision_requested: 'Revision requested',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const ROLE_LABELS: Record<string, string> = {
  research_leadership: 'Research leadership',
  platform_ops: 'Platform operations',
};

type Props = {
  data: ProspectusPublic;
  showEditHint?: boolean;
};

export function ProspectusReadOnlyView({ data, showEditHint }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <p className="font-medium">{STATUS_LABELS[data.status] ?? data.status}</p>
        {data.submittedAt && (
          <p className="text-sm text-muted-foreground">
            Submitted {new Date(data.submittedAt).toLocaleString()}
          </p>
        )}
        {data.approvedAt && (
          <p className="text-sm text-muted-foreground">
            Approved {new Date(data.approvedAt).toLocaleString()}
          </p>
        )}
        {data.status === 'revision_requested' && showEditHint && (
          <p className="text-sm">
            Reviewers requested changes. Scroll down if your form editor is available, or refresh this
            page — editable sections reopen automatically.
          </p>
        )}
        {data.linkedStudySlug && (
          <p className="text-sm">
            Linked study: <code className="text-xs">{data.linkedStudySlug}</code>
          </p>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">Dual approval</h2>
        {data.approvals.map((slot) => (
          <div key={slot.role} className="flex flex-wrap items-start justify-between gap-2 text-sm border-b last:border-0 py-2">
            <span className="text-muted-foreground">{ROLE_LABELS[slot.role] ?? slot.role}</span>
            <div className="text-right">
              <Badge variant={slot.decision === 'approved' ? 'default' : 'outline'}>
                {slot.decision ?? 'pending'}
              </Badge>
              {slot.comments && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{slot.comments}</p>}
            </div>
          </div>
        ))}
      </div>

      <ProspectusSummary data={data} />

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={prospectusPaths.landing}>Prospectus home</Link>
        </Button>
      </div>
    </div>
  );
}

function ProspectusSummary({ data }: { data: ProspectusPublic }) {
  const sections: { title: string; body: string }[] = [
    { title: 'Principal investigator', body: data.principalInvestigator },
    { title: 'Research problem', body: data.researchProblem },
    { title: 'Aims', body: data.aims },
    { title: 'Significance', body: data.significance },
    { title: 'Methodology design', body: data.methodology?.design ?? '' },
    { title: 'Ethics notes', body: data.ethicsNotes },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Summary</h2>
      {sections.map(
        (s) =>
          s.body.trim() && (
            <div key={s.title}>
              <h3 className="text-sm font-medium text-muted-foreground">{s.title}</h3>
              <p className="text-sm whitespace-pre-wrap mt-1">{s.body}</p>
            </div>
          ),
      )}
      {data.coInvestigators.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Co-investigators</h3>
          <ul className="list-disc pl-5 text-sm mt-1">
            {data.coInvestigators.map((c, i) => (
              <li key={`${c.name}-${i}`}>{formatCoInvestigator(c)}</li>
            ))}
          </ul>
        </div>
      )}
      {data.researchQuestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Research questions</h3>
          <ul className="list-disc pl-5 text-sm mt-1">
            {data.researchQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
