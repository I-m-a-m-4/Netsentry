'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Cell } from 'recharts';
import { Sparkles, Package, FileText, Zap } from 'lucide-react';
import type { Academy, Subject } from '@/types';

interface FeatureStickinessChartProps {
  businesses: Academy[];
  subjects: Subject[];
}

export default function FeatureStickinessChart({ businesses, subjects }: FeatureStickinessChartProps) {
  const chartData = React.useMemo(() => {
    const total = businesses.filter(b => b.status !== 'deleted').length;
    if (total === 0) return [];

    const stats = {
        'AI Analysis': 0,
        'Subject Tracking': 0,
        'Pro Reports': 0,
        'Multiple Users': 0
    };

    const businessProductCounts = subjects.reduce((acc, p) => {
        acc[p.academyId] = (acc[p.academyId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    businesses.forEach(b => {
        // AI Adoption
        if (b.settings?.academyAnalysis) stats['AI Analysis']++;
        
        // Subject Tracking (> 50 subjects)
        if ((businessProductCounts[b.id] || 0) > 50) stats['Subject Tracking']++;

        // Multiple Users (check if they have invited others - mocked for now or infer from user count per biz if available)
        // Assume if they are on Pro/Business, they are stickier with reporting
        if (b.plan === 'pro' || b.plan === 'academy') stats['Pro Reports']++;
        
        // Mocking Multiple Users adoption based on plan
        if (b.plan === 'academy') stats['Multiple Users']++;
    });

    return Object.entries(stats).map(([name, count]) => ({
        name,
        Adoption: (count / total) * 100,
        count
    })).sort((a, b) => b.Adoption - a.Adoption);
  }, [businesses, subjects]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> Feature Stickiness Index
        </CardTitle>
        <CardDescription>Adoption percentage of Pro features across all academies.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={chartData} layout="vertical" margin={{ left: 40, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" unit="%" hide />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
            <ReTooltip 
                cursor={{ fill: 'transparent' }}
                formatter={(val: number) => [`${val.toFixed(1)}%`, 'Adoption']}
            />
            <Bar dataKey="Adoption" radius={[0, 4, 4, 0]} barSize={30}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
