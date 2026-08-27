

"use client"

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { PieChart as PieChartIcon, Bot } from "lucide-react";
import type { Subject } from '@/types';

interface CategoryPieChartProps {
  subjects: Subject[];
}

export default function CategoryPieChart({ subjects }: CategoryPieChartProps) {
  const chartDataResult = React.useMemo(() => {
    if (!subjects) return { data: [], config: {} };

    const categoryCounts: Record<string, number> = {};
    subjects.forEach(product => {
      if (product.categoryType === 'service') return;
      const categoryKey = product.category || 'Uncategorized';
      categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + Math.max(0, product.stock || 0);
    });

    const chartColors = ["#f97316", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b"];

    const sortedData = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, items], index) => ({
        name,
        items,
        fill: chartColors[index % chartColors.length],
      }));

    const newConfig: ChartConfig = {};
    sortedData.forEach(item => {
      newConfig[item.name] = {
        label: item.name,
        color: item.fill,
      }
    });

    return { data: sortedData, config: newConfig };
  }, [subjects]);

  const { data: chartData, config: chartConfig } = chartDataResult;

  const totalItems = React.useMemo(() => {
    return subjects.filter(p => p.categoryType !== 'service').reduce((acc, curr) => acc + Math.max(0, curr.stock || 0), 0);
  }, [subjects]);

  const noData = chartData.length === 0;

    return (
    <Card className="flex flex-col shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer">
      <CardHeader>
        <CardTitle>Syllabus by Subject</CardTitle>
        <CardDescription>Topics distribution across subject syllabi.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {noData ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-center text-muted-foreground">
            <PieChartIcon className="h-16 w-16 opacity-50 mb-4" />
            <p className="text-sm max-w-sm">Add subjects with topics to see your syllabus distribution here.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel indicator="dot" />}
                />
                <Pie
                  data={chartData}
                  dataKey="items"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total Topics: {totalItems.toLocaleString()}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing topic distribution of all active subjects.
        </div>
      </CardFooter>
    </Card>
  );
}
