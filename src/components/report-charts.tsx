"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const attendanceData = [
  { date: "Mon", present: 85, absent: 15 },
  { date: "Tue", present: 92, absent: 8 },
  { date: "Wed", present: 95, absent: 5 },
  { date: "Thu", present: 88, absent: 12 },
  { date: "Fri", present: 98, absent: 2 },
]

const quizScoresData = [
  { range: "90-100", count: 25, fill: "hsl(var(--chart-1))" },
  { range: "80-89", count: 45, fill: "hsl(var(--chart-2))" },
  { range: "70-79", count: 18, fill: "hsl(var(--chart-3))" },
  { range: "60-69", count: 8, fill: "hsl(var(--chart-4))" },
  { range: "<60", count: 4, fill: "hsl(var(--chart-5))" },
]


export function ReportCharts() {
  return (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Weekly Attendance Overview</CardTitle>
          <CardDescription>Present vs. Absent students this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[250px] w-full">
            <BarChart accessibilityLayer data={attendanceData} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
               <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="present" fill="hsl(var(--chart-1))" radius={4} name="Present" />
              <Bar dataKey="absent" fill="hsl(var(--muted))" radius={4} name="Absent" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Quiz Score Distribution</CardTitle>
          <CardDescription>Latest test results distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[250px] w-full">
            <PieChart accessibilityLayer>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={quizScoresData}
                    dataKey="count"
                    nameKey="range"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {quizScoresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
