import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, User, Mail, Calendar, Palette } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              {isLoading ? (
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
              ) : (
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/10">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <h3 className="font-bold text-xl">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {user?.role}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal identity details in AMX Suite.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Email Address</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Joined Date</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : '-'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your AMX Suite experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="theme-toggle" className="text-base font-medium">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle the interface color theme.</p>
                  </div>
                </div>
                <Switch 
                  id="theme-toggle" 
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}