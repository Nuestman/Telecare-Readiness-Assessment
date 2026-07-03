import { useLocation } from "wouter";
import { useAdmin } from "@/context/AdminContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import { clinicianStudyConfig } from "@/studies/clinician-telehealth-readiness/config";
import { AdminRegisterForm } from "@/studies/telehealth-readiness/components/AdminRegisterForm";
import { studyPaths } from "@/studies/clinician-telehealth-readiness/paths";

export default function AdminRegisterPage() {
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
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Research team registration</CardTitle>
          <CardDescription>
            Create an admin account for {clinicianStudyConfig.shortTitle}.
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

export function ClinicianAdminRegisterLink() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Need an account?{" "}
      <a href={studyPaths.registration} className="text-primary font-medium hover:underline">
        Register
      </a>
    </p>
  );
}
