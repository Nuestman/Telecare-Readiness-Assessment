import { useGetClinicianSurveyStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsCharts } from "@/studies/clinician-telehealth-readiness/components/AnalyticsCharts";
import { clinicianStudyConfig as cfg } from "@/studies/clinician-telehealth-readiness/config";
import { clinicianAdminLayout } from "@/studies/clinician-telehealth-readiness/admin-layout";
import { Printer, Users, Stethoscope } from "lucide-react";

export default function AdminReportPage() {
  const { data: stats, isLoading } = useGetClinicianSurveyStats({});

  return (
    <AdminLayout study={clinicianAdminLayout}>
      <div className="space-y-6 print:space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight">Clinician Pilot Report</h2>
            <p className="text-muted-foreground">Printable summary for leadership meetings.</p>
          </div>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" />
            Print report
          </Button>
        </div>

        <div className="hidden print:block text-center space-y-2 border-b pb-4">
          <h1 className="text-2xl font-bold">{cfg.organization}</h1>
          <p className="text-lg">{cfg.shortTitle} — Pilot Report</p>
          <p className="text-sm text-muted-foreground">Generated {new Date().toLocaleDateString()}</p>
        </div>

        {isLoading || !stats ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Total responses</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_responses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Avg willingness</CardTitle>
                  <Stethoscope className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avg_willingness_score.toFixed(1)} / 5</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Self-efficacy index</CardTitle>
                  <Stethoscope className="h-4 w-4 text-chart-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avg_self_efficacy_score.toFixed(1)} / 5</div>
                </CardContent>
              </Card>
            </div>
            <AnalyticsCharts stats={stats} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
