import { useLocation } from 'wouter';
import { useAdmin } from '@/context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';
import { telehealthStudyConfig } from '@/studies/telehealth-readiness/config';
import { AdminLoginForm } from '@/studies/telehealth-readiness/components/AdminLoginForm';
import { AdminRegisterLink } from '@/studies/telehealth-readiness/pages/AdminRegisterPage';
import { studyPaths } from '@/studies/telehealth-readiness/paths';

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdmin();

  if (isAuthenticated) {
    navigate(studyPaths.admin);
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Research Team Login</CardTitle>
          <CardDescription>
            {telehealthStudyConfig.organization} — {telehealthStudyConfig.shortTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminLoginForm
            onSuccess={() => navigate(studyPaths.admin)}
            showCancel
            onCancel={() => navigate(studyPaths.landing)}
          />
          <AdminRegisterLink />
        </CardContent>
      </Card>
    </div>
  );
}
