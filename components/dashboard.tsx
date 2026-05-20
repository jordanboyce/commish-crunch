'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Lightbulb,
  Bug,
  Briefcase,
  Landmark,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { salesDB, SaleRecord } from '@/lib/sales-db';

type IndustryMeta = { id: string; name: string; icon: LucideIcon };

const INDUSTRIES: IndustryMeta[] = [
  { id: 'solar', name: 'Solar', icon: Sun },
  { id: 'lighting', name: 'Lighting', icon: Lightbulb },
  { id: 'pest', name: 'Pest Control', icon: Bug },
  { id: 'financial', name: 'Financial', icon: Landmark },
  { id: 'generic', name: 'Generic', icon: Briefcase },
];

const industryMeta = (id: string): IndustryMeta =>
  INDUSTRIES.find((i) => i.id === id) ?? { id, name: id, icon: Briefcase };

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

interface DashboardProps {
  sales: SaleRecord[];
  onChange?: () => void;
}

export default function Dashboard({ sales }: DashboardProps) {
  const router = useRouter();

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const completed = sales.filter((s) => s.status === 'completed');
    const pending = sales.filter((s) => s.status === 'pending');

    const completionDate = (s: SaleRecord) => s.dateCompleted ?? s.dateCreated;

    const mtdCommission = completed
      .filter((s) => completionDate(s) >= startOfMonth)
      .reduce((sum, s) => sum + s.commission, 0);

    const ytdCommission = completed
      .filter((s) => completionDate(s) >= startOfYear)
      .reduce((sum, s) => sum + s.commission, 0);

    const pendingPipeline = pending.reduce((sum, s) => sum + s.commission, 0);

    return {
      mtdCommission,
      ytdCommission,
      pendingPipeline,
      pendingCount: pending.length,
      completedCount: completed.length,
    };
  }, [sales]);

  const industryBreakdown = useMemo(() => {
    const byIndustry = new Map<string, { commission: number; count: number }>();
    for (const s of sales) {
      if (s.status !== 'completed') continue;
      const entry = byIndustry.get(s.industry) ?? { commission: 0, count: 0 };
      entry.commission += s.commission;
      entry.count += 1;
      byIndustry.set(s.industry, entry);
    }
    const rows = Array.from(byIndustry.entries())
      .map(([id, v]) => ({ ...industryMeta(id), ...v }))
      .sort((a, b) => b.commission - a.commission);
    const max = rows.reduce((m, r) => Math.max(m, r.commission), 0);
    return { rows, max };
  }, [sales]);

  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
        .slice(0, 8),
    [sales],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Picker + greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Sales</h1>
          <p className="text-sm text-gray-600">
            Snapshot across all your commission calculators.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((calc) => {
            const Icon = calc.icon;
            return (
              <Button
                key={calc.id}
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${calc.id}`)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                <span>{calc.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.mtdCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Year to Date</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.ytdCommission)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">
                  Pending ({stats.pendingCount})
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.pendingPipeline)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Completed Sales</p>
                <p className="text-2xl font-bold">{stats.completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>By Industry</CardTitle>
            <CardDescription>Completed commission, all time.</CardDescription>
          </CardHeader>
          <CardContent>
            {industryBreakdown.rows.length === 0 ? (
              <p className="text-sm text-gray-500">
                No completed sales yet. Mark a sale completed to see it here.
              </p>
            ) : (
              <ul className="space-y-3">
                {industryBreakdown.rows.map((row) => {
                  const Icon = row.icon;
                  const pct =
                    industryBreakdown.max > 0
                      ? (row.commission / industryBreakdown.max) * 100
                      : 0;
                  return (
                    <li
                      key={row.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                      onClick={() => router.push(`/${row.id}`)}
                    >
                      <div className="flex items-center gap-2 w-28">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">{row.name}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-700 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-right text-sm tabular-nums">
                        <div className="font-semibold">
                          {formatCurrency(row.commission)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.count} {row.count === 1 ? 'sale' : 'sales'}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your last few sales across all calculators.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-500">No sales yet.</p>
            ) : (
              <ul className="divide-y">
                {recentSales.map((sale) => {
                  const meta = industryMeta(sale.industry);
                  const Icon = meta.icon;
                  const statusColor =
                    sale.status === 'completed'
                      ? 'default'
                      : sale.status === 'pending'
                        ? 'secondary'
                        : 'destructive';
                  return (
                    <li
                      key={sale.id}
                      className="py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                      onClick={() => router.push(`/${sale.industry}`)}
                    >
                      <Icon className="h-4 w-4 text-gray-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {sale.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {meta.name} &middot; {formatDate(sale.dateCreated)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-700">
                          {formatCurrency(sale.commission)}
                        </div>
                        <Badge variant={statusColor} className="text-[10px] px-1.5 py-0">
                          {sale.status}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
