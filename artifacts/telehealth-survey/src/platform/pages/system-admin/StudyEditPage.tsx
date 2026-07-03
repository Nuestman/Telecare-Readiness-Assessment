import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { SystemAdminLayout } from '@/platform/components/SystemAdminLayout';
import { fetchSystemStudies, patchSystemStudy } from '@/platform/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function StudyEditPage() {
  const [, params] = useRoute('/system/admin/studies/:slug');
  const slug = params?.slug ?? '';
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['system-studies'],
    queryFn: fetchSystemStudies,
  });

  const study = data?.studies.find((s) => s.slug === slug);
  const [status, setStatus] = useState('draft');
  const [shortTitle, setShortTitle] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (study) {
      setStatus(study.status);
      setShortTitle(study.shortTitle);
    }
  }, [study]);

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => patchSystemStudy(slug, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['system-studies'] });
      setSaved(true);
    },
  });

  if (!study) {
    return (
      <SystemAdminLayout>
        <p>Study not found.</p>
      </SystemAdminLayout>
    );
  }

  return (
    <SystemAdminLayout>
      <h1 className="text-2xl font-semibold mb-2">{study.shortTitle}</h1>
      <p className="text-sm text-muted-foreground mb-6">{slug}</p>

      <form
        className="space-y-4 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          mutation.mutate({ status, short_title: shortTitle });
        }}
      >
        <div className="space-y-2">
          <Label>Short title</Label>
          <Input value={shortTitle} onChange={(e) => setShortTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      </form>
    </SystemAdminLayout>
  );
}
