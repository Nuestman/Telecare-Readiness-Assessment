import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useGetAuthSetupStatus } from '@workspace/api-client-react';
import { useAdmin } from '@/context/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse } from 'lucide-react';
import { telehealthStudyConfig } from '@/studies/telehealth-readiness/config';
import { AdminRegisterForm } from '@/studies/telehealth-readiness/components/AdminRegisterForm';
import { studyPaths } from '@/studies/telehealth-readiness/paths';

export default function AdminRegisterPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAdmin();
  const { data: setupStatus, isLoading } = useGetAuthSetupStatus();

  useEffect(() => {
    if (!isLoading && setupStatus && !setupStatus.registration_open) {
      navigate(studyPaths.adminLogin);
    }
  }, [isLoading, setupStatus, navigate]);

  if (isAuthenticated) {
    navigate(studyPaths.admin);
    return null;
  }

  if (isLoading || !setupStatus?.registration_open) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Set up research admin</CardTitle>
          <CardDescription>
            Create the first admin account for {telehealthStudyConfig.shortTitle}. This page
            closes after one account is created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminRegisterForm
            onSuccess={() => navigate(studyPaths.admin)}
            onCancel={() => navigate(studyPaths.adminLogin)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminRegisterLink() {
  const { data: setupStatus } = useGetAuthSetupStatus();

  if (!setupStatus?.registration_open) {
    return null;
  }

  return (
    <p className="text-center text-sm text-muted-foreground">
      No admin yet?{' '}
      <Link href={studyPaths.adminRegister} className="text-primary font-medium hover:underline">
        Create the first admin account
      </Link>
    </p>
  );
}
