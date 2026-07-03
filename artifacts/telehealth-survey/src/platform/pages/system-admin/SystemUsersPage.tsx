import { useQuery } from '@tanstack/react-query';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchSystemUsers } from '@/platform/lib/api';
import { Card, CardContent } from '@/components/ui/card';

export default function SystemUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-users'],
    queryFn: fetchSystemUsers,
  });

  return (
    <SystemAdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Study-team accounts</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.users.map((user) => (
          <Card key={user.id}>
            <CardContent className="py-4">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs mt-2">
                Studies:{' '}
                {user.studyAccess.length
                  ? user.studyAccess.map((a) => `${a.slug} (${a.role})`).join(', ')
                  : 'none'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SystemAdminLayout>
  );
}
