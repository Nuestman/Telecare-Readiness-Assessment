import { useState } from "react";
import { useListSurveys, useGetSurveyStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, Activity, HeartPulse, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: stats, isLoading: statsLoading } = useGetSurveyStats();
  const { data: surveysData, isLoading: surveysLoading } = useListSurveys({ page, limit });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Aggregate insights from the telehealth readiness survey.
          </p>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
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
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Individual survey submissions from staff and contractors.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>NCD Status</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Willingness</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveysLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : surveysData?.surveys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No responses yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    surveysData?.surveys.map(survey => (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(survey.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="capitalize">{survey.employment_type}</TableCell>
                        <TableCell>
                          {survey.has_ncd === 'yes' ? (
                            <Badge variant="destructive" className="bg-chart-4 hover:bg-chart-4/80 text-chart-4-foreground border-transparent">Yes</Badge>
                          ) : survey.has_ncd === 'no' ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">No</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Prefer not to say</Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{survey.attends_followup}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{survey.willing_to_use_telehealth}</span>
                            <span className="text-muted-foreground text-xs">/ 5</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/survey/${survey.id}`}>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= surveysData.total}
                  >
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
