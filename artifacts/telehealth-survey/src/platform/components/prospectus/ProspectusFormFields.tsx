import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CoInvestigatorFormRow, ProspectusFormValues, ProspectusTimelinePhase } from '@/platform/lib/types';
import { coInvestigatorRoleOptions, isPresetCoInvestigatorRole, newCoInvestigatorFormRow } from '@/platform/lib/prospectus-form';

type StringListFieldProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function StringListField({ label, values, onChange, placeholder }: StringListFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...values];
              next[index] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            disabled={values.length <= 1}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ''])}>
        Add row
      </Button>
    </div>
  );
}

type CoInvestigatorFieldProps = {
  values: CoInvestigatorFormRow[];
  onChange: (values: CoInvestigatorFormRow[]) => void;
};

export function CoInvestigatorField({ values, onChange }: CoInvestigatorFieldProps) {
  return (
    <div className="space-y-2">
      <Label>Co-investigators</Label>
      {values.map((row) => {
        const roleOptions = coInvestigatorRoleOptions(row.role);
        const selectValue = isPresetCoInvestigatorRole(row.role)
          ? row.role
          : row.role.trim()
            ? 'Other'
            : undefined;
        const showOtherInput = selectValue === 'Other';

        return (
          <div key={row.clientId} className="space-y-2 border rounded-md p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <Label htmlFor={`co-name-${row.clientId}`} className="text-xs text-muted-foreground">
                  Name
                </Label>
                <Input
                  id={`co-name-${row.clientId}`}
                  value={row.name}
                  placeholder="Full name"
                  onChange={(e) => {
                    onChange(
                      values.map((r) =>
                        r.clientId === row.clientId ? { ...r, name: e.target.value } : r,
                      ),
                    );
                  }}
                />
              </div>
              <div>
                <Label htmlFor={`co-role-${row.clientId}`} className="text-xs text-muted-foreground">
                  Role
                </Label>
                <Select
                  value={selectValue}
                  onValueChange={(role) => {
                    onChange(
                      values.map((r) =>
                        r.clientId === row.clientId
                          ? { ...r, role: role === 'Other' ? 'Other' : role }
                          : r,
                      ),
                    );
                  }}
                >
                  <SelectTrigger id={`co-role-${row.clientId}`}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-end"
                onClick={() => onChange(values.filter((r) => r.clientId !== row.clientId))}
                disabled={values.length <= 1}
              >
                Remove
              </Button>
            </div>
            {showOtherInput && (
              <div>
                <Label htmlFor={`co-role-other-${row.clientId}`} className="text-xs text-muted-foreground">
                  Specify role
                </Label>
                <Input
                  id={`co-role-other-${row.clientId}`}
                  value={row.role === 'Other' ? '' : row.role}
                  placeholder="e.g. Health economist"
                  onChange={(e) => {
                    const customRole = e.target.value.trim() ? e.target.value : 'Other';
                    onChange(
                      values.map((r) =>
                        r.clientId === row.clientId ? { ...r, role: customRole } : r,
                      ),
                    );
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...values, newCoInvestigatorFormRow()])}
      >
        Add co-investigator
      </Button>
    </div>
  );
}

type TimelineFieldProps = {
  values: ProspectusTimelinePhase[];
  onChange: (values: ProspectusTimelinePhase[]) => void;
};

export function TimelineField({ values, onChange }: TimelineFieldProps) {
  return (
    <div className="space-y-3">
      <Label>Timeline phases</Label>
      {values.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-4 border rounded-md p-3">
          <Input
            placeholder="Phase"
            value={row.phase}
            onChange={(e) => {
              const next = [...values];
              next[index] = { ...row, phase: e.target.value };
              onChange(next);
            }}
          />
          <Input
            type="date"
            value={row.start}
            onChange={(e) => {
              const next = [...values];
              next[index] = { ...row, start: e.target.value };
              onChange(next);
            }}
          />
          <Input
            type="date"
            value={row.end}
            onChange={(e) => {
              const next = [...values];
              next[index] = { ...row, end: e.target.value };
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            disabled={values.length <= 1}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...values, { phase: '', start: '', end: '' }])}
      >
        Add phase
      </Button>
    </div>
  );
}

type SectionProps = {
  values: ProspectusFormValues;
  onChange: (values: ProspectusFormValues) => void;
  submitterName: string;
  submitterEmail: string;
};

export function ProspectusSectionFields({
  step,
  ...props
}: SectionProps & { step: number }) {
  switch (step) {
    case 0:
      return <IdentitySection {...props} />;
    case 1:
      return <TitleSection {...props} />;
    case 2:
      return <BackgroundSection {...props} />;
    case 3:
      return <ProblemSection {...props} />;
    case 4:
      return <LiteratureSection {...props} />;
    case 5:
      return <MethodologySection {...props} />;
    case 6:
      return <SignificanceSection {...props} />;
    case 7:
      return <EthicsSection {...props} />;
    case 8:
      return <TimelineSection {...props} />;
    case 9:
      return <ReferencesSection {...props} />;
    default:
      return null;
  }
}

function IdentitySection({ values, onChange, submitterName, submitterEmail }: SectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Submitter: {submitterName} ({submitterEmail})
      </p>
      <div>
        <Label htmlFor="pi">Principal investigator</Label>
        <Input
          id="pi"
          value={values.principalInvestigator}
          onChange={(e) => onChange({ ...values, principalInvestigator: e.target.value })}
        />
      </div>
      <CoInvestigatorField
        values={values.coInvestigators}
        onChange={(coInvestigators) => onChange({ ...values, coInvestigators })}
      />
      <div>
        <Label htmlFor="dept">Department / unit</Label>
        <Input
          id="dept"
          value={values.department}
          onChange={(e) => onChange({ ...values, department: e.target.value })}
        />
      </div>
    </div>
  );
}

function TitleSection({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Working title</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
        />
      </div>
      <div>
        <Label>Study type</Label>
        <Select
          value={values.studyType}
          onValueChange={(studyType) =>
            onChange({ ...values, studyType: studyType as ProspectusFormValues['studyType'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="survey">Survey</SelectItem>
            <SelectItem value="mixed_methods">Mixed methods</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Study template (IT triage)</Label>
        <Select
          value={values.studyTemplate}
          onValueChange={(studyTemplate) =>
            onChange({ ...values, studyTemplate: studyTemplate as ProspectusFormValues['studyTemplate'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="telehealth-readiness-clone">Community telehealth clone</SelectItem>
            <SelectItem value="clinician-clone">Clinician telehealth clone</SelectItem>
            <SelectItem value="custom">Custom (new build)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="slug">Proposed URL slug (optional)</Label>
        <Input
          id="slug"
          placeholder="my-study-name"
          value={values.proposedSlug}
          onChange={(e) => onChange({ ...values, proposedSlug: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, and hyphens only.</p>
      </div>
    </div>
  );
}

function BackgroundSection({ values, onChange }: SectionProps) {
  return (
    <div>
      <Label htmlFor="background">Introduction and background</Label>
      <Textarea
        id="background"
        rows={8}
        value={values.background}
        onChange={(e) => onChange({ ...values, background: e.target.value })}
      />
    </div>
  );
}

function ProblemSection({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="problem">Research problem</Label>
        <Textarea
          id="problem"
          rows={4}
          value={values.researchProblem}
          onChange={(e) => onChange({ ...values, researchProblem: e.target.value })}
        />
      </div>
      <StringListField
        label="Research questions"
        values={values.researchQuestions}
        onChange={(researchQuestions) => onChange({ ...values, researchQuestions })}
      />
      <div>
        <Label htmlFor="aims">Aims</Label>
        <Textarea
          id="aims"
          rows={3}
          value={values.aims}
          onChange={(e) => onChange({ ...values, aims: e.target.value })}
        />
      </div>
      <StringListField
        label="Objectives"
        values={values.objectives}
        onChange={(objectives) => onChange({ ...values, objectives })}
      />
    </div>
  );
}

function LiteratureSection({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="lit">Literature overview</Label>
        <Textarea
          id="lit"
          rows={6}
          value={values.literatureOverview}
          onChange={(e) => onChange({ ...values, literatureOverview: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="framework">Theoretical framework (optional)</Label>
        <Textarea
          id="framework"
          rows={4}
          value={values.theoreticalFramework}
          onChange={(e) => onChange({ ...values, theoreticalFramework: e.target.value })}
        />
      </div>
    </div>
  );
}

function MethodologySection({ values, onChange }: SectionProps) {
  const m = values.methodology;
  const setMethodology = (patch: Partial<typeof m>) =>
    onChange({ ...values, methodology: { ...m, ...patch } });

  return (
    <div className="space-y-4">
      <div>
        <Label>Approach</Label>
        <Select value={m.approach} onValueChange={(approach) => setMethodology({ approach: approach as typeof m.approach })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quantitative">Quantitative</SelectItem>
            <SelectItem value="qualitative">Qualitative</SelectItem>
            <SelectItem value="mixed_methods">Mixed methods</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(['design', 'population', 'sampling', 'instruments', 'analysis'] as const).map((field) => (
        <div key={field}>
          <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
          <Textarea
            id={field}
            rows={3}
            value={m[field]}
            onChange={(e) => setMethodology({ [field]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function SignificanceSection({ values, onChange }: SectionProps) {
  return (
    <div>
      <Label htmlFor="significance">Significance of the study</Label>
      <Textarea
        id="significance"
        rows={6}
        value={values.significance}
        onChange={(e) => onChange({ ...values, significance: e.target.value })}
      />
    </div>
  );
}

function EthicsSection({ values, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ethics">Ethics notes</Label>
        <Textarea
          id="ethics"
          rows={4}
          value={values.ethicsNotes}
          onChange={(e) => onChange({ ...values, ethicsNotes: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="identifiable"
          checked={values.identifiableData}
          onCheckedChange={(checked) =>
            onChange({ ...values, identifiableData: checked === true })
          }
        />
        <Label htmlFor="identifiable">This study will collect identifiable participant data</Label>
      </div>
      {values.identifiableData && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Compliance review is required before dual approval can complete.
        </p>
      )}
      <div>
        <Label htmlFor="irb">Ethics / IRB reference (if available)</Label>
        <Input
          id="irb"
          value={values.ethicsReference}
          onChange={(e) => onChange({ ...values, ethicsReference: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="retention">Data retention plan</Label>
        <Textarea
          id="retention"
          rows={3}
          value={values.dataRetention}
          onChange={(e) => onChange({ ...values, dataRetention: e.target.value })}
        />
      </div>
    </div>
  );
}

function TimelineSection({ values, onChange }: SectionProps) {
  return <TimelineField values={values.timeline} onChange={(timeline) => onChange({ ...values, timeline })} />;
}

function ReferencesSection({ values, onChange }: SectionProps) {
  return (
    <div>
      <Label htmlFor="refs">Preliminary references</Label>
      <Textarea
        id="refs"
        rows={8}
        value={values.referencesText}
        onChange={(e) => onChange({ ...values, referencesText: e.target.value })}
        placeholder="APA or department-required citation format"
      />
    </div>
  );
}
