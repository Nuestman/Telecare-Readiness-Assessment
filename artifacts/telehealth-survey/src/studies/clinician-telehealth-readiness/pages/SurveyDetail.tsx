import { useParams, Link } from "wouter";
import { useGetClinicianSurvey, getGetClinicianSurveyQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { studyPaths } from "@/studies/clinician-telehealth-readiness/paths";
import { clinicianAdminLayout } from "@/studies/clinician-telehealth-readiness/admin-layout";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">{children}</CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-2 border-b last:border-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="md:col-span-2 text-sm capitalize">{value}</div>
    </div>
  );
}

function fmt(str?: string | null) {
  if (!str) return null;
  return str.replace(/_/g, " ");
}

function fmtList(str?: string | null) {
  if (!str) return null;
  return str.split(",").map((s) => s.trim().replace(/_/g, " ")).join(", ");
}

export default function SurveyDetail() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : 0;

  const { data: survey, isLoading, error } = useGetClinicianSurvey(id, {
    query: { enabled: !!id, queryKey: getGetClinicianSurveyQueryKey(id) },
  });

  if (isLoading) {
    return (
      <AdminLayout study={clinicianAdminLayout}>
        <Skeleton className="h-8 w-48" />
      </AdminLayout>
    );
  }

  if (error || !survey) {
    return (
      <AdminLayout study={clinicianAdminLayout}>
        <p className="text-destructive">Response not found.</p>
        <Link href={studyPaths.admin}>
          <Button variant="outline" className="mt-4">Back</Button>
        </Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout study={clinicianAdminLayout}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={studyPaths.admin}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Response #{survey.id}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(survey.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        <Section title="Professional profile">
          <DataRow label="Clinical role" value={fmt(survey.clinical_role)} />
          <DataRow label="Role (other)" value={survey.clinical_role_other} />
          <DataRow label="Department" value={fmt(survey.department)} />
          <DataRow label="Department (other)" value={survey.department_other} />
          <DataRow label="Years in practice" value={fmt(survey.years_in_clinical_practice)} />
          <DataRow label="Years at AGA Health" value={fmt(survey.years_at_aga_health)} />
          <DataRow label="Telehealth exposure" value={fmt(survey.telehealth_exposure_in_role)} />
        </Section>

        <Section title="Awareness & prior use">
          <DataRow label="Heard of telehealth" value={fmt(survey.heard_of_telehealth)} />
          <DataRow label="Awareness sources" value={fmtList(survey.awareness_sources)} />
          <DataRow label="Used telehealth before" value={fmt(survey.used_telehealth_before)} />
          <DataRow label="Modalities used" value={fmtList(survey.used_modalities)} />
          <DataRow label="National policy awareness" value={fmt(survey.national_policy_awareness)} />
        </Section>

        <Section title="Self-efficacy & workflow">
          <DataRow label="Video consultation confidence" value={`${survey.confidence_video_consultation}/5`} />
          <DataRow label="Phone follow-up confidence" value={`${survey.confidence_phone_followup}/5`} />
          <DataRow label="Async messaging confidence" value={`${survey.confidence_async_messaging}/5`} />
          <DataRow label="Remote vitals confidence" value={`${survey.confidence_remote_vitals}/5`} />
          <DataRow label="Digital documentation confidence" value={`${survey.confidence_digital_documentation}/5`} />
          <DataRow label="Workflow integration" value={fmt(survey.workflow_integration)} />
          <DataRow label="Team coordination" value={fmt(survey.team_coordination)} />
        </Section>

        <Section title="Willingness">
          <DataRow label="Overall willingness" value={`${survey.willing_to_provide_telehealth}/5`} />
          <DataRow label="NCD telecare" value={fmt(survey.willing_ncd_telecare)} />
          <DataRow label="Routine review" value={fmt(survey.willing_routine_review)} />
          <DataRow label="Triage" value={fmt(survey.willing_triage)} />
          <DataRow label="Preferred modalities" value={fmtList(survey.preferred_modalities)} />
          <DataRow label="Prescribe after remote" value={fmt(survey.willing_prescribe_after_remote)} />
          <DataRow label="Remote monitoring" value={fmt(survey.willing_remote_monitoring)} />
        </Section>

        <Section title="Feedback">
          <DataRow label="Suggestions" value={survey.suggestions} />
        </Section>
      </div>
    </AdminLayout>
  );
}
