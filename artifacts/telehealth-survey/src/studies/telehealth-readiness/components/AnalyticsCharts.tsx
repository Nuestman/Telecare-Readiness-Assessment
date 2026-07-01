import type { SurveyStats } from '@workspace/api-client-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

function breakdownToChartData(data: Record<string, number> | undefined) {
  if (!data) return [];
  return Object.entries(data).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));
}

function buildChartConfig(chartData: { name: string }[]): ChartConfig {
  const config: ChartConfig = {};
  chartData.forEach((entry, index) => {
    const key = `segment${index}`;
    config[key] = {
      label: entry.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });
  return config;
}

type AnalyticsChartsProps = {
  stats: SurveyStats;
};

function BreakdownChart({ title, data }: { title: string; data: Record<string, number> | undefined }) {
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
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent labelKey="name" hideIndicator />} />
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

export function AnalyticsCharts({ stats }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BreakdownChart title="Age groups" data={stats.age_group_breakdown} />
      <BreakdownChart title="Gender" data={stats.gender_breakdown} />
      <BreakdownChart title="Employment type" data={stats.employment_type_breakdown} />
      <BreakdownChart title="NCD status" data={stats.has_ncd_breakdown} />
      <BreakdownChart title="Follow-up attendance" data={stats.attends_followup_breakdown} />
      <BreakdownChart title="Willingness to use telehealth" data={stats.willingness_breakdown} />
      <BreakdownChart title="Willing for NCD telecare" data={stats.willing_for_ncd_telecare_breakdown} />
      <BreakdownChart title="Willing for follow-up telecare" data={stats.willing_for_followup_telecare_breakdown} />
    </div>
  );
}
