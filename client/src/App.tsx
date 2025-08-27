import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import FinancialPage from "@/pages/financial-page";
import AdminFinancialDashboard from "@/pages/admin-financial-dashboard";
import MyFeesPage from "@/pages/my-fees-page";
import VisitorsPage from "@/pages/visitors-page";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ClearSessions from "@/pages/clear-sessions";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/clear-sessions" component={ClearSessions} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/admin" component={Admin} />
          <Route path="/financial" component={FinancialPage} />
          <Route path="/admin/financial" component={AdminFinancialDashboard} />
          <Route path="/my-fees" component={MyFeesPage} />
          <Route path="/visitors" component={VisitorsPage} />
          <Route path="/auth" component={AuthPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
