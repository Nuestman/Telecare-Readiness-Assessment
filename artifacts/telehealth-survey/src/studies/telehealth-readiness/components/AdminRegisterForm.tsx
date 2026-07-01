import { useState } from 'react';
import { useRegisterAdmin } from '@workspace/api-client-react';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, AlertCircle } from 'lucide-react';

type AdminRegisterFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function AdminRegisterForm({ onSuccess, onCancel }: AdminRegisterFormProps) {
  const { refresh } = useAdmin();
  const registerMutation = useRegisterAdmin();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await registerMutation.mutateAsync({ data: { name, email, password } });
      const me = await refresh();
      if (!me) {
        setError('Account created, but the session could not be established. Try signing in.');
        return;
      }
      onSuccess?.();
    } catch {
      setError('Could not create admin account. Registration may already be closed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-register-name">Full name</Label>
        <Input
          id="admin-register-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-register-email">Email</Label>
        <Input
          id="admin-register-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-register-password">Password</Label>
        <Input
          id="admin-register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" className="w-full gap-2" disabled={registerMutation.isPending}>
        <UserPlus className="w-4 h-4" />
        {registerMutation.isPending ? 'Creating account...' : 'Create admin account'}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Back to sign in
        </Button>
      )}
    </form>
  );
}
