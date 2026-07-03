import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, LoaderCircle, Play, Server, TestTube2 } from 'lucide-react';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchSystemHealth, runSystemSmokeTests } from '@/platform/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusVariant(status: 'ok' | 'error' | 'idle' | 'running' | 'passed' | 'failed') {
  if (status === 'error' || status === 'failed') return 'destructive' as const;
  return 'outline' as const;
}

export default function SystemHealthPage() {
  const queryClient = useQueryClient();
  const { data, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: (query) => (query.state.data?.smokeTests.status === 'running' ? 2000 : 10000),
  });

  const runTests = useMutation({
    mutationFn: runSystemSmokeTests,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['system-health'] });
    },
  });

  const isRunning = data?.smokeTests.status === 'running' || runTests.isPending;

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">System health</h1>
            <p className="text-sm text-muted-foreground">
              Check platform health and run built-in API smoke tests from the dashboard.
            </p>
          </div>
          <Button onClick={() => runTests.mutate()} disabled={isRunning}>
            {isRunning ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Running tests…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run smoke tests
              </>
            )}
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load system health</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : 'Unknown error'}</AlertDescription>
          </Alert>
        ) : null}

        {runTests.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not start smoke tests</AlertTitle>
            <AlertDescription>
              {runTests.error instanceof Error ? runTests.error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={statusVariant(data?.api.status ?? 'ok')}>
                {data?.api.status ?? '—'}
              </Badge>
              <p>Uptime: {data ? `${data.api.uptimeSeconds}s` : '—'}</p>
              <p>Environment: {data?.api.nodeEnv ?? '—'}</p>
              <p>Port: {data?.api.port ?? '—'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={statusVariant(data?.database.status ?? 'ok')}>
                {data?.database.status ?? '—'}
              </Badge>
              <p>Registered studies: {data?.database.studyCount ?? '—'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Smoke tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={statusVariant(data?.smokeTests.status ?? 'idle')}>
                {data?.smokeTests.status ?? '—'}
              </Badge>
              <p>Runner: {data?.smokeTests.runner ?? 'builtin'}</p>
              <p>Last exit code: {data?.smokeTests.exitCode ?? '—'}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TestTube2 className="h-4 w-4" />
              Smoke test run
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <p className="text-muted-foreground">Started</p>
                <p>{formatDateTime(data?.smokeTests.startedAt ?? null)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Finished</p>
                <p>{formatDateTime(data?.smokeTests.finishedAt ?? null)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Summary</p>
                <p>{data?.smokeTests.summary ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Checked</p>
                <p>{formatDateTime(data?.checkedAt ?? null)}</p>
              </div>
            </div>

            <Textarea
              readOnly
              value={data?.smokeTests.output ?? ''}
              className="min-h-72 font-mono text-xs"
              placeholder="Smoke test output will appear here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              What this runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Tests run inside the API process against <code>http://127.0.0.1</code> using{' '}
              <code>SYSTEM_ADMIN_*</code> or <code>INITIAL_ADMIN_*</code> credentials.
            </p>
            <p>
              Checks include <code>healthz</code>, public studies, system admin login/dashboard,
              system health, study login, <code>auth/me</code>, and survey listing.
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Results are cached in memory so you can refresh or revisit the page while a run completes.
            </p>
          </CardContent>
        </Card>
      </div>
    </SystemAdminLayout>
  );
}
