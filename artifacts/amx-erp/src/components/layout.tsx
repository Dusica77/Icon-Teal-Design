import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Package, 
  Briefcase, 
  LineChart, 
  Settings, 
  LogOut,
  Bell,
  Sun,
  Moon,
  TrendingUp,
  Menu
} from "lucide-react";
import { useGetMe, useLogout, useListNotifications } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { data: notifications } = useListNotifications();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("amx_token");
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/finance", icon: Wallet, label: "Finance" },
    { href: "/hr", icon: Users, label: "HR & Payroll" },
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/projects", icon: Briefcase, label: "Projects" },
    { href: "/analytics", icon: LineChart, label: "Analytics" },
    { href: "/forecast", icon: TrendingUp, label: "AI Forecast" },
  ];

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const NavLinks = () => (
    <div className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
            location === item.href 
              ? "bg-primary text-primary-foreground" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}>
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border bg-gradient-to-b from-sidebar to-sidebar-accent">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-primary-foreground font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-lg">A</span>
            </div>
            AMX Suite
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/settings">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              location === "/settings" 
                ? "bg-primary text-primary-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}>
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </div>
          </Link>
          <div 
            onClick={handleLogout}
            className="mt-2 flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-card">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                  <span className="text-xl font-bold">AMX Suite</span>
                </div>
                <NavLinks />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold md:hidden">AMX</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative cursor-pointer">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role || 'Role'}</p>
              </div>
              <Link href="/settings">
                <Avatar className="cursor-pointer border-2 border-primary/20 hover:border-primary transition-colors">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}