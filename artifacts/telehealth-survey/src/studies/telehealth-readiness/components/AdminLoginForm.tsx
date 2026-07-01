import { useState } from 'react';
import { useLogin } from '@workspace/api-client-react';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/studies/telehealth-readiness/lib/format-api-error';
import { Lock, AlertCircle } from 'lucide-react';

type AdminLoginFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
};

export function AdminLoginForm({ onSuccess, onCancel, showCancel = false }: AdminLoginFormProps) {
  const { refresh } = useAdmin();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginMutation.mutateAsync({ data: { email, password } });
      const me = await refresh();
      if (!me) {
        setError('Signed in, but the session could not be verified. Refresh the page and try again.');
        return;
      }
      onSuccess?.();
    } catch (err) {
      setError(formatApiError(err, 'Invalid email or password.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-login-email">Email</Label>
        <Input
          id="admin-login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-login-password">Password</Label>
        <Input
          id="admin-login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" className="w-full gap-2" disabled={loginMutation.isPending}>
        <Lock className="w-4 h-4" />
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
      </Button>
      {showCancel && onCancel && (
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </form>
  );
}
