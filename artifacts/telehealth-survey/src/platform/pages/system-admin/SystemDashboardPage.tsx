import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchSystemDashboard, fetchSystemStudies } from '@/platform/lib/api';
import { systemAdminPaths } from '@/platform/paths';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SystemDashboardPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['system-dashboard'],
    queryFn: fetchSystemDashboard,
  });
  const { data: studiesData } = useQuery({
    queryKey: ['system-studies'],
    queryFn: fetchSystemStudies,
  });

  return (
    <SystemAdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Studies</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{dashboard?.studyCount ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{dashboard?.activeStudies ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total responses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{dashboard?.totalResponses ?? '—'}</CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Studies</h2>
        {studiesData?.studies.map((study) => (
          <Card key={study.slug}>
            <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{study.shortTitle}</p>
                <p className="text-sm text-muted-foreground">{study.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{study.status}</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link href={systemAdminPaths.studyEdit(study.slug)}>Edit</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={systemAdminPaths.studyAccess(study.slug)}>Access</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SystemAdminLayout>
  );
}
