import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchSystemStudies } from '@/platform/lib/api';
import { systemAdminPaths } from '@/platform/paths';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudiesListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-studies'],
    queryFn: fetchSystemStudies,
  });

  return (
    <SystemAdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Study registry</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.studies.map((study) => (
          <Card key={study.slug}>
            <CardContent className="py-4 flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="font-medium">{study.shortTitle}</p>
                <p className="text-sm text-muted-foreground">{study.responsesTable}</p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant="outline">{study.status}</Badge>
                <Button asChild size="sm">
                  <Link href={systemAdminPaths.studyEdit(study.slug)}>Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SystemAdminLayout>
  );
}
