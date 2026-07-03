import { useState } from 'react';
import {
  useListAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  getListAdminUsersQueryKey,
  type AdminUserPublic,
  type CreateAdminUserInput,
  type UpdateAdminUserInput,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/context/AdminContext';
import { formatApiError, isPermissionError } from '@/studies/telehealth-readiness/lib/format-api-error';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Pencil, Trash2, Check, X, AlertCircle, RefreshCw } from 'lucide-react';

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: CreateAdminUserInput['role'];
  status: CreateAdminUserInput['status'];
};

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'viewer',
  status: 'approved',
};

function statusBadge(status: AdminUserPublic['status']) {
  if (status === 'approved') return <Badge className="bg-chart-2 text-white">Approved</Badge>;
  if (status === 'pending') return <Badge variant="secondary">Pending</Badge>;
  return <Badge variant="destructive">Rejected</Badge>;
}

function validateForm(form: UserFormState, editing: boolean): string | null {
  if (!form.name.trim()) return 'Name is required.';
  if (!editing) {
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Enter a valid email address.';
    }
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
  } else if (form.password && form.password.length < 8) {
    return 'New password must be at least 8 characters.';
  }
  return null;
}

export default function AdminUsersPage() {
  const { user } = useAdmin();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useListAdminUsers({
    query: {
      queryKey: getListAdminUsersQueryKey(),
      retry: 1,
    },
  });
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserPublic | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const users = data?.users ?? [];
  const permissionDenied = isError && isPermissionError(error);
  const listErrorMessage = isError
    ? formatApiError(error, 'Could not load users. Try again.')
    : '';

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (u: AdminUserPublic) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      status: u.status,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    const validationError = validateForm(form, Boolean(editingUser));
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      if (editingUser) {
        const payload: UpdateAdminUserInput = {
          name: form.name.trim(),
          role: form.role,
          status: form.status,
        };
        if (form.password) payload.password = form.password;
        await updateUser.mutateAsync({ id: editingUser.id, data: payload });
        toast({ title: 'User updated', description: `${editingUser.email} was saved.` });
      } else {
        await createUser.mutateAsync({
          data: {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: form.role,
            status: form.status,
          },
        });
        toast({ title: 'User created', description: `${form.email.trim()} was added.` });
      }
      await invalidate();
      setDialogOpen(false);
    } catch (err) {
      const message = formatApiError(
        err,
        editingUser ? 'Could not update user.' : 'Could not create user.',
      );
      setFormError(message);
    }
  };

  const setStatus = async (u: AdminUserPublic, status: AdminUserPublic['status']) => {
    setActionError('');
    try {
      await updateUser.mutateAsync({ id: u.id, data: { status } });
      await invalidate();
      toast({
        title: status === 'approved' ? 'User approved' : 'User rejected',
        description: u.email,
      });
    } catch (err) {
      const message = formatApiError(err, `Could not ${status === 'approved' ? 'approve' : 'reject'} user.`);
      setActionError(message);
      toast({ variant: 'destructive', title: 'Action failed', description: message });
    }
  };

  const handleDelete = async (u: AdminUserPublic) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    setActionError('');
    try {
      await deleteUser.mutateAsync({ id: u.id });
      await invalidate();
      toast({ title: 'User deleted', description: u.email });
    } catch (err) {
      const message = formatApiError(err, 'Could not delete user.');
      setActionError(message);
      toast({ variant: 'destructive', title: 'Delete failed', description: message });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-heading font-bold tracking-tight">User management</h2>
            <p className="text-muted-foreground mt-1">
              Approve registrations and manage research team access.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2" disabled={isError}>
            <UserPlus className="w-4 h-4" />
            Add user
          </Button>
        </div>

        {listErrorMessage && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {permissionDenied
                  ? `${listErrorMessage} Contact a study administrator if you need a role change.`
                  : listErrorMessage}
              </span>
            </div>
            {!permissionDenied ? (
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => refetch()}>
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            ) : null}
          </div>
        )}

        {actionError && !listErrorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Team accounts</CardTitle>
            <CardDescription>
              {isLoading
                ? 'Loading users...'
                : isError
                  ? 'Users could not be loaded.'
                  : `${users.length} account${users.length === 1 ? '' : 's'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        Unable to load users.
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No users yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell>{statusBadge(u.status)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {u.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Approve"
                                  disabled={updateUser.isPending}
                                  onClick={() => setStatus(u, 'approved')}
                                >
                                  <Check className="w-4 h-4 text-chart-2" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Reject"
                                  disabled={updateUser.isPending}
                                  onClick={() => setStatus(u, 'rejected')}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={u.id === user?.id || deleteUser.isPending}
                              onClick={() => handleDelete(u)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit user' : 'Add user'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update role, status, or reset password.'
                : 'Create a new research team account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {editingUser ? 'New password (optional)' : 'Password'}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, role: v as UserFormState['role'] }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as UserFormState['status'] }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createUser.isPending || updateUser.isPending}
            >
              {createUser.isPending || updateUser.isPending
                ? 'Saving...'
                : editingUser
                  ? 'Save changes'
                  : 'Create user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
