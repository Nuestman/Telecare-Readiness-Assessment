import { useMemo, useState } from "react";
import {
  useListClinicianSurveys,
  useGetClinicianSurveyStats,
  type ListClinicianSurveysParams,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, Stethoscope, Shield, Download } from "lucide-react";
import { FilterBar } from "@/studies/clinician-telehealth-readiness/components/FilterBar";
import { AnalyticsCharts } from "@/studies/clinician-telehealth-readiness/components/AnalyticsCharts";
import { downloadClinicianSurveyExport } from "@/studies/clinician-telehealth-readiness/lib/export-surveys";
import { studyPaths, STUDY_SLUG } from "@/studies/clinician-telehealth-readiness/paths";
import { clinicianAdminLayout } from "@/studies/clinician-telehealth-readiness/admin-layout";
import { useAdmin } from "@/context/AdminContext";

const defaultFilters: ListClinicianSurveysParams = {};

export default function AdminDashboard() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListClinicianSurveysParams>(defaultFilters);
  const [exporting, setExporting] = useState(false);
  const limit = 20;
  const { getStudyRole } = useAdmin();

  const queryParams = useMemo(
    () => ({ ...filters, page, limit }),
    [filters, page, limit],
  );

  const { data: stats, isLoading: statsLoading } = useGetClinicianSurveyStats(filters);
  const { data: surveysData, isLoading: surveysLoading } = useListClinicianSurveys(queryParams);
  const studyRole = getStudyRole(STUDY_SLUG);
  const canExport = studyRole === "analyst" || studyRole === "admin";

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadClinicianSurveyExport(filters);
    } catch {
      alert("Export failed. You may need analyst access.");
    } finally {
      setExporting(false);
    }
  };

  const formatLabel = (value?: string | null) =>
    value ? value.replace(/_/g, " ") : "—";

  return (
    <AdminLayout study={clinicianAdminLayout}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight">Clinician Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Telehealth readiness among clinical staff — filtered analytics and responses.
            </p>
          </div>
          {canExport && (
            <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          )}
        </div>

        <FilterBar
          filters={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onReset={() => {
            setFilters(defaultFilters);
            setPage(1);
          }}
        />

        {stats && <AnalyticsCharts stats={stats} />}

        {statsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_responses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Willingness</CardTitle>
                <Stethoscope className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_willingness_score.toFixed(1)} / 5</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Self-efficacy</CardTitle>
                <Shield className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_self_efficacy_score.toFixed(1)} / 5</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Heard of telehealth</CardTitle>
                <Stethoscope className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats.heard_of_telehealth_rate * 100)}%
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
            <CardDescription>Individual clinician submissions matching current filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Willingness</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveysLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : surveysData?.surveys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No responses match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    surveysData?.surveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(survey.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">{formatLabel(survey.clinical_role)}</TableCell>
                        <TableCell className="capitalize">{formatLabel(survey.department)}</TableCell>
                        <TableCell>{survey.willing_to_provide_telehealth} / 5</TableCell>
                        <TableCell className="text-right">
                          <Link href={studyPaths.adminResponse(survey.id)}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {surveysData && surveysData.total > limit && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, surveysData.total)} of {surveysData.total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= surveysData.total}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
