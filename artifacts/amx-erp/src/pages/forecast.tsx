import { 
  useGetDemandForecast,
  useGetRevenueForecast
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { BrainCircuit, TrendingUp } from "lucide-react";

export default function Forecast() {
  const { data: demandData, isLoading: isLoadingDemand } = useGetDemandForecast();
  const { data: revenueData, isLoading: isLoadingRevenue } = useGetRevenueForecast();

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Forecast</h2>
          <p className="text-muted-foreground mt-1">Machine learning predictions for future enterprise performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle>Revenue Projection (Next 6 Months)</CardTitle>
            <CardDescription>Based on historical transaction data and market trends.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${value/1000}k`}
                      dx={-10}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Actual Revenue"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Projected Trend"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Demand Forecasting</CardTitle>
            <CardDescription>Predicted inventory needs for key products.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDemand ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demandData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="currentDemand" 
                      name="Current Demand"
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecastedDemand" 
                      name="AI Forecast"
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}