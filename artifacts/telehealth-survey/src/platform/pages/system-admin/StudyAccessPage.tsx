import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchStudyAccess, fetchSystemUsers, grantStudyAccess } from '@/platform/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function StudyAccessPage() {
  const [, params] = useRoute('/system/admin/studies/:slug/access');
  const slug = params?.slug ?? '';
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('viewer');

  const { data: accessData } = useQuery({
    queryKey: ['study-access', slug],
    queryFn: () => fetchStudyAccess(slug),
    enabled: !!slug,
  });

  const { data: usersData } = useQuery({
    queryKey: ['system-users'],
    queryFn: fetchSystemUsers,
  });

  const grantMutation = useMutation({
    mutationFn: () => grantStudyAccess(slug, Number(userId), role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['study-access', slug] });
      setUserId('');
    },
  });

  return (
    <SystemAdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Study access — {slug}</h1>

      <div className="space-y-3 mb-8">
        {accessData?.access.map((row) => (
          <Card key={row.id}>
            <CardContent className="py-3 flex justify-between">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.email}</p>
              </div>
              <span className="text-sm">{row.role}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <form
        className="space-y-4 max-w-md border rounded-lg p-4"
        onSubmit={(e) => {
          e.preventDefault();
          grantMutation.mutate();
        }}
      >
        <h2 className="font-medium">Grant access</h2>
        <div className="space-y-2">
          <Label>User</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {usersData?.users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={!userId || grantMutation.isPending}>
          Grant access
        </Button>
      </form>
    </SystemAdminLayout>
  );
}
