'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useId } from 'react';

import ChartTooltip from './ChartTooltip';

export default function PerformanceChart({ data }) {
  if (!data || data.length === 0) return null;

  const gradientId = useId().replace(/:/g, '');

  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 14, right: 10, left: -18, bottom: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.28} />
              <stop offset="78%" stopColor="var(--chart-accent)" stopOpacity={0.04} />
              <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>

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
          />

          <Tooltip
            cursor={{ stroke: 'var(--chart-hover-line)', strokeWidth: 1.5, strokeDasharray: '3 6' }}
            content={
              <ChartTooltip
                valueFormatter={(value) => [Number(value).toLocaleString(), 'Score']}
              />
            }
          />

          <Area
            type="monotone"
            dataKey="score"
            name="score"
            stroke="var(--chart-accent)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 5,
              fill: 'var(--chart-accent)',
              stroke: 'var(--chart-surface-strong)',
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
