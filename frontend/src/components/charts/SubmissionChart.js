'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import ChartTooltip from './ChartTooltip';

export default function SubmissionChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 14, right: 10, left: -18, bottom: 2 }}
          barCategoryGap="34%"
        >
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="3 9"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11, fontWeight: 600 }}
            tickMargin={14}
            minTickGap={24}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11, fontWeight: 600 }}
            tickMargin={10}
            width={30}
            allowDecimals={false}
          />

          <Tooltip
            cursor={{ fill: 'var(--chart-hover-fill)' }}
            content={
              <ChartTooltip
                valueFormatter={(value) => [Number(value).toLocaleString(), 'Submissions']}
              />
            }
          />

          <Bar
            dataKey="count"
            name="submissions"
            fill="var(--chart-bar)"
            radius={[14, 14, 4, 4]}
            maxBarSize={36}
            isAnimationActive
            animationDuration={820}
            animationEasing="ease-out"
            activeBar={{
              fill: 'var(--chart-bar-active)',
              radius: [14, 14, 4, 4]
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
