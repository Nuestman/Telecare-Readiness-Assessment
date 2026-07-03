import type { ClinicianSurveyStats } from "@workspace/api-client-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

function breakdownToChartData(data: Record<string, number> | undefined) {
  if (!data) return [];
  return Object.entries(data).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));
}

function buildChartConfig(chartData: { name: string }[]): ChartConfig {
  const config: ChartConfig = {
    value: { label: "Count" },
  };
  chartData.forEach((entry, index) => {
    const key = `segment${index}`;
    config[key] = {
      label: entry.name,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });
  return config;
}

function BreakdownChart({
  title,
  data,
}: {
  title: string;
  data: Record<string, number> | undefined;
}) {
  const chartData = breakdownToChartData(data);
  if (chartData.length === 0) return null;
  const chartConfig = buildChartConfig(chartData);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
              tickLine={false}
              axisLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent labelKey="name" />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`var(--color-segment${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

type AnalyticsChartsProps = {
  stats: ClinicianSurveyStats;
};

export function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BreakdownChart title="Clinical role" data={stats.clinical_role_breakdown} />
      <BreakdownChart title="Department" data={stats.department_breakdown} />
      <BreakdownChart title="Willingness to provide telehealth" data={stats.willingness_breakdown} />
      <BreakdownChart title="NCD telecare willingness" data={stats.willing_ncd_telecare_breakdown} />
      <BreakdownChart title="Routine review willingness" data={stats.willing_routine_review_breakdown} />
      <BreakdownChart title="Triage willingness" data={stats.willing_triage_breakdown} />
      <BreakdownChart title="Training needs" data={stats.training_needs_breakdown} />
      <BreakdownChart title="Preferred modalities" data={stats.preferred_modalities_breakdown} />
    </div>
  );
}
