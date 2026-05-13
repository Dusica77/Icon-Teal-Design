import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useEffect } from "react";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Finance from "@/pages/finance";
import Hr from "@/pages/hr";
import Inventory from "@/pages/inventory";
import Projects from "@/pages/projects";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import Forecast from "@/pages/forecast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: any }) {
  const [location, setLocation] = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("amx_token") : null;
  const { data: user, isLoading, error } = useGetMe({ 
    query: { 
      enabled: !!token, 
      retry: false
    } 
  });

  useEffect(() => {
    if (!token || error) {
      setLocation("/login");
    }
  }, [token, error, setLocation]);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!user) return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("amx_token") : null;

  useEffect(() => {
    if (location === "/" && token) {
      setLocation("/dashboard");
    } else if (location === "/" && !token) {
      setLocation("/login");
    }
  }, [location, token, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/finance"><ProtectedRoute component={Finance} /></Route>
      <Route path="/hr"><ProtectedRoute component={Hr} /></Route>
      <Route path="/inventory"><ProtectedRoute component={Inventory} /></Route>
      <Route path="/projects"><ProtectedRoute component={Projects} /></Route>
      <Route path="/analytics"><ProtectedRoute component={Analytics} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
      <Route path="/forecast"><ProtectedRoute component={Forecast} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;