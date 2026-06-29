import { useParams, Link } from "wouter";
import { useGetSurvey, getGetSurveyQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Activity, Smartphone, PhoneCall, AlertTriangle, MessageSquare } from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string, value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 py-2 border-b last:border-0 border-border/50">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="md:col-span-2 text-sm text-foreground capitalize-first">{value}</div>
    </div>
  );
}

export default function SurveyDetail() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : 0;
  
  const { data: survey, isLoading, error } = useGetSurvey(id, {
    query: { enabled: !!id, queryKey: getGetSurveyQueryKey(id) }
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !survey) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Survey not found or an error occurred.</p>
          <Link href="/admin">
            <Button variant="outline" className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const formatList = (str?: string | null) => {
    if (!str) return null;
    return str.split(',').map(s => s.trim().replace(/_/g, ' ')).join(', ');
  };

  const formatText = (str?: string | null) => {
    if (!str) return null;
    return str.replace(/_/g, ' ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-heading font-bold tracking-tight">Survey Response #{survey.id}</h2>
            <p className="text-sm text-muted-foreground">
              Submitted on {new Date(survey.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        <Section title="Demographics" icon={User}>
          <DataRow label="Age Group" value={formatText(survey.age_group)} />
          <DataRow label="Gender" value={formatText(survey.gender)} />
          <DataRow label="Employment Type" value={formatText(survey.employment_type)} />
          <DataRow label="Work Area" value={survey.work_area} />
          <DataRow label="Years at AGA" value={formatText(survey.years_at_aga)} />
        </Section>

        <Section title="Health Background" icon={Activity}>
          <DataRow label="Has NCD" value={
            <Badge variant={survey.has_ncd === 'yes' ? 'destructive' : 'outline'} className={survey.has_ncd === 'yes' ? 'bg-chart-4 text-chart-4-foreground border-transparent' : ''}>
              {formatText(survey.has_ncd)}
            </Badge>
          } />
          {survey.has_ncd === 'yes' && (
            <>
              <DataRow label="NCD Types" value={formatList(survey.ncd_types)} />
              <DataRow label="Other NCD" value={survey.other_ncd} />
              <DataRow label="Currently on Treatment" value={formatText(survey.currently_on_treatment)} />
              <DataRow label="Treatment Location" value={formatText(survey.treatment_location)} />
            </>
          )}
          <DataRow label="Attends Follow-up" value={formatText(survey.attends_followup)} />
          {survey.attends_followup !== 'always' && (
            <>
              <DataRow label="Missed Follow-up Reasons" value={formatList(survey.missed_followup_reasons)} />
              <DataRow label="Other Reason" value={survey.other_missed_reason} />
            </>
          )}
        </Section>

        <Section title="Technology Access" icon={Smartphone}>
          <DataRow label="Has Smartphone" value={formatText(survey.has_smartphone)} />
          {survey.has_smartphone === 'yes' && (
            <DataRow label="Smartphone Usage" value={formatText(survey.smartphone_usage)} />
          )}
          <DataRow label="Has Internet" value={formatText(survey.has_internet)} />
          {survey.has_internet === 'yes' && (
            <DataRow label="Internet Quality" value={formatText(survey.internet_quality)} />
          )}
          <DataRow label="Comfortable with Video Call" value={formatText(survey.comfortable_with_video_call)} />
        </Section>

        <Section title="Telehealth Readiness" icon={PhoneCall}>
          <DataRow label="Heard of Telehealth" value={formatText(survey.heard_of_telehealth)} />
          {survey.heard_of_telehealth === 'yes' && (
            <DataRow label="Sources" value={formatList(survey.telehealth_sources)} />
          )}
          <DataRow label="Used Telehealth Before" value={formatText(survey.used_telehealth_before)} />
          <DataRow label="Willingness to Use (1-5)" value={
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-transparent">{survey.willing_to_use_telehealth} / 5</Badge>
            </div>
          } />
          <DataRow label="Preferred Mode" value={formatText(survey.preferred_telehealth_mode)} />
          <DataRow label="Preferred Use" value={formatList(survey.preferred_telehealth_use)} />
          <DataRow label="Willing for NCD Telecare" value={formatText(survey.willing_for_ncd_telecare)} />
          <DataRow label="Willing for Follow-up Telecare" value={formatText(survey.willing_for_followup_telecare)} />
        </Section>

        <Section title="Concerns & Feedback" icon={AlertTriangle}>
          <DataRow label="Privacy Concern (1-5)" value={survey.privacy_concern} />
          <DataRow label="Tech Difficulty Concern (1-5)" value={survey.technical_difficulty_concern} />
          <DataRow label="Effectiveness Concern (1-5)" value={survey.effectiveness_concern} />
          <DataRow label="Other Concerns" value={survey.other_concerns} />
          <DataRow label="Suggestions" value={survey.suggestions} />
        </Section>
        
        <div className="text-xs text-muted-foreground text-center pb-8">
          Consent given: {survey.consent_given ? "Yes" : "No"}
        </div>
      </div>
    </AdminLayout>
  );
}
