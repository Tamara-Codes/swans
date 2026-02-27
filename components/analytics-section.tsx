'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Label as RechartsLabel,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { estimatedHoursSaved } from '@/lib/utils'
import type { Intake } from '@/types/intake'
import { format, parseISO, isSameMonth } from 'date-fns'
import { TrendingUp, Clock, AlertTriangle, FileText } from 'lucide-react'

function getThisMonthIntakes(intakes: Intake[]) {
  const now = new Date()
  return intakes.filter((i) => {
    try { return isSameMonth(parseISO(i.created_at), now) } catch { return false }
  })
}

function averageSpeedToLead(intakes: Intake[]): string {
  const sent = intakes.filter((i) => i.status === 'Sent' && i.sent_at)
  if (!sent.length) return '—'
  const avg = sent.reduce((acc, i) => {
    return acc + (new Date(i.sent_at!).getTime() - new Date(i.uploaded_at).getTime())
  }, 0) / sent.length
  const totalSeconds = Math.floor(avg / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}m ${secs}s`
}

function getMonthlyData(intakes: Intake[]) {
  const counts: Record<string, number> = {}
  intakes.forEach((i) => {
    try {
      const month = format(parseISO(i.created_at), 'MMM yy')
      counts[month] = (counts[month] ?? 0) + 1
    } catch {}
  })
  return Object.entries(counts)
    .map(([month, intakes]) => ({ month, intakes }))
    .slice(-6)
}

const monthlyChartConfig: ChartConfig = {
  intakes: { label: 'Intakes', color: 'hsl(var(--foreground))' },
}

const injuryChartConfig: ChartConfig = {
  injury: { label: 'Bodily Injury', color: '#f97316' },
  pdo: { label: 'Property Damage Only', color: '#94a3b8' },
}

export function AnalyticsSection({ intakes }: { intakes: Intake[] }) {
  const thisMonth = getThisMonthIntakes(intakes)
  const sentThisMonth = thisMonth.filter((i) => i.status === 'Sent')
  const avgSpeed = averageSpeedToLead(intakes)
  const hoursSaved = estimatedHoursSaved(sentThisMonth.length)
  const flaggedCount = intakes.filter((i) => i.injury_flag || i.status === 'Flagged').length

  // Funnel
  const total = intakes.length || 1
  const funnelSteps = [
    { label: 'Uploaded', count: intakes.length, color: '#e2e8f0' },
    { label: 'In Review', count: intakes.filter((i) => ['Review', 'Flagged', 'Approved', 'Sent'].includes(i.status)).length, color: '#93c5fd' },
    { label: 'Approved', count: intakes.filter((i) => ['Approved', 'Sent'].includes(i.status)).length, color: '#6ee7b7' },
    { label: 'Sent', count: intakes.filter((i) => i.status === 'Sent').length, color: '#34d399' },
  ]

  // Injury split
  const injuryCount = intakes.filter((i) => i.injury_flag).length
  const pdoCount = intakes.length - injuryCount
  const injuryBarData = [
    { category: 'Bodily Injury', value: injuryCount, fill: '#f97316' },
    { category: 'Property Damage Only', value: pdoCount, fill: '#94a3b8' },
  ]

  const monthlyData = getMonthlyData(intakes)

  const kpis = [
    {
      label: 'Intakes This Month',
      value: thisMonth.length.toString(),
      icon: FileText,
      sub: 'total received',
    },
    {
      label: 'Avg Speed-to-Lead',
      value: avgSpeed,
      icon: Clock,
      sub: 'upload → sent',
    },
    {
      label: 'Est. Hours Saved',
      value: hoursSaved,
      icon: TrendingUp,
      sub: `${sentThisMonth.length} sent × 45 min`,
    },
    {
      label: 'Flagged for Review',
      value: flaggedCount.toString(),
      icon: AlertTriangle,
      sub: 'require attention',
    },
  ]

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="border-slate-100 shadow-none">
              <CardHeader className="pb-2 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs text-slate-400">{kpi.label}</CardDescription>
                  <Icon className="h-4 w-4 text-slate-300" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-3xl font-semibold text-slate-800 tracking-tight">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Status Funnel */}
        <Card className="border-slate-100 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">Status Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5">
            {funnelSteps.map((step) => {
              const pct = Math.round((step.count / total) * 100)
              return (
                <div key={step.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-slate-600">{step.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{step.count}</span>
                      <span className="text-xs text-slate-400 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: step.color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Injury vs PDO — donut chart */}
        <Card className="border-slate-100 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">Injury vs. PDO</CardTitle>
            <CardDescription className="text-xs">Case type breakdown</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <ChartContainer config={injuryChartConfig} className="h-[140px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={injuryBarData}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={42}
                  outerRadius={62}
                  strokeWidth={2}
                  stroke="white"
                >
                  {injuryBarData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                  <RechartsLabel
                    content={({ viewBox }) => {
                      if (!viewBox || !('cx' in viewBox)) return null
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-800 text-xl font-bold" style={{ fontSize: 18, fontWeight: 700 }}>
                            {intakes.length}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} style={{ fontSize: 10, fill: '#94a3b8' }}>
                            total
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-1">
              {injuryBarData.map((d) => (
                <div key={d.category} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-slate-500">{d.category}</span>
                  <span className="text-xs font-semibold text-slate-700 ml-1">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Bar Chart */}
        <Card className="border-slate-100 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">Intakes by Month</CardTitle>
            <CardDescription className="text-xs">Last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {monthlyData.length > 0 ? (
              <ChartContainer config={monthlyChartConfig} className="h-[120px] w-full">
                <BarChart
                  data={monthlyData}
                  margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                  barSize={24}
                >
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={<ChartTooltipContent hideLabel={false} />}
                  />
                  <Bar dataKey="intakes" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-sm text-slate-400">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
