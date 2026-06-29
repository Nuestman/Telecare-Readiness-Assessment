import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import NotFound from '@/pages/not-found';
import LandingPage from '@/pages/LandingPage';
import SurveyPage from '@/pages/SurveyPage';
import AdminDashboard from '@/pages/AdminDashboard';
import SurveyDetail from '@/pages/SurveyDetail';
import { Route, Switch, Router as WouterRouter, useLocation, Redirect } from 'wouter';

const queryClient = new QueryClient();

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdmin();
  if (!isAuthenticated) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/survey" component={SurveyPage} />
      <Route path="/admin">
        {() => <ProtectedAdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/survey/:id">
        {() => <ProtectedAdminRoute component={SurveyDetail} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
}

export default App;
