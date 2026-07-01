import { useMemo, useState } from "react";
import { useListSurveys, useGetSurveyStats, type ListSurveysParams } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, Activity, HeartPulse, Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/studies/telehealth-readiness/components/FilterBar";
import { AnalyticsCharts } from "@/studies/telehealth-readiness/components/AnalyticsCharts";
import { downloadSurveyExport } from "@/studies/telehealth-readiness/lib/export-surveys";
import { studyPaths } from "@/studies/telehealth-readiness/paths";
import { useAdmin } from "@/context/AdminContext";

const defaultFilters: ListSurveysParams = {};

export default function AdminDashboard() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ListSurveysParams>(defaultFilters);
  const [exporting, setExporting] = useState(false);
  const limit = 20;
  const { user } = useAdmin();

  const queryParams = useMemo(
    () => ({ ...filters, page, limit }),
    [filters, page, limit],
  );

  const { data: stats, isLoading: statsLoading } = useGetSurveyStats(filters);
  const { data: surveysData, isLoading: surveysLoading } = useListSurveys(queryParams);

  const canExport = user?.role === 'analyst' || user?.role === 'admin';

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadSurveyExport(filters);
    } catch {
      alert('Export failed. You may need analyst access.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-muted-foreground mt-1">
              Telehealth readiness pilot — filtered analytics and responses.
            </p>
          </div>
          {canExport && (
            <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
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

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
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
                <HeartPulse className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_willingness_score.toFixed(1)} / 5</div>
                <p className="text-xs text-muted-foreground mt-1">To use telehealth services</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">NCD Prevalence</CardTitle>
                <Activity className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_responses > 0 
                    ? Math.round(((stats.has_ncd_breakdown['yes'] || 0) / stats.total_responses) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Report having an NCD</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Smartphone Access</CardTitle>
                <Smartphone className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(stats.has_smartphone_rate * 100)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Own a smartphone</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
            <CardDescription>Individual survey submissions matching current filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Work area</TableHead>
                    <TableHead>NCD</TableHead>
                    <TableHead>Willingness</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveysLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : surveysData?.surveys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No responses match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    surveysData?.surveys.map((survey) => (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(survey.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">{survey.employment_type}</TableCell>
                        <TableCell>{survey.work_area}</TableCell>
                        <TableCell className="capitalize">{survey.has_ncd}</TableCell>
                        <TableCell>{survey.willing_to_use_telehealth} / 5</TableCell>
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
