"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Customer service activity chart"

const chartData = [
  { date: "2024-04-01", newCustomers: 12, activeReminders: 45, customerActivity: 89 },
  { date: "2024-04-02", newCustomers: 8, activeReminders: 42, customerActivity: 76 },
  { date: "2024-04-03", newCustomers: 15, activeReminders: 48, customerActivity: 94 },
  { date: "2024-04-04", newCustomers: 11, activeReminders: 44, customerActivity: 87 },
  { date: "2024-04-05", newCustomers: 18, activeReminders: 52, customerActivity: 103 },
  { date: "2024-04-06", newCustomers: 9, activeReminders: 39, customerActivity: 71 },
  { date: "2024-04-07", newCustomers: 6, activeReminders: 35, customerActivity: 68 },
  { date: "2024-04-08", newCustomers: 14, activeReminders: 47, customerActivity: 91 },
  { date: "2024-04-09", newCustomers: 16, activeReminders: 50, customerActivity: 97 },
  { date: "2024-04-10", newCustomers: 10, activeReminders: 41, customerActivity: 82 },
  { date: "2024-04-11", newCustomers: 13, activeReminders: 46, customerActivity: 88 },
  { date: "2024-04-12", newCustomers: 7, activeReminders: 38, customerActivity: 74 },
  { date: "2024-04-13", newCustomers: 12, activeReminders: 43, customerActivity: 85 },
  { date: "2024-04-14", newCustomers: 5, activeReminders: 33, customerActivity: 65 },
  { date: "2024-04-15", newCustomers: 9, activeReminders: 40, customerActivity: 79 },
  { date: "2024-04-16", newCustomers: 17, activeReminders: 51, customerActivity: 99 },
  { date: "2024-04-17", newCustomers: 11, activeReminders: 44, customerActivity: 86 },
  { date: "2024-04-18", newCustomers: 14, activeReminders: 48, customerActivity: 92 },
  { date: "2024-04-19", newCustomers: 8, activeReminders: 37, customerActivity: 73 },
  { date: "2024-04-20", newCustomers: 13, activeReminders: 45, customerActivity: 89 },
  { date: "2024-04-21", newCustomers: 6, activeReminders: 34, customerActivity: 67 },
  { date: "2024-04-22", newCustomers: 15, activeReminders: 49, customerActivity: 95 },
  { date: "2024-04-23", newCustomers: 10, activeReminders: 42, customerActivity: 81 },
  { date: "2024-04-24", newCustomers: 16, activeReminders: 53, customerActivity: 101 },
  { date: "2024-04-25", newCustomers: 12, activeReminders: 46, customerActivity: 88 },
  { date: "2024-04-26", newCustomers: 7, activeReminders: 36, customerActivity: 72 },
  { date: "2024-04-27", newCustomers: 14, activeReminders: 47, customerActivity: 90 },
  { date: "2024-04-28", newCustomers: 9, activeReminders: 39, customerActivity: 77 },
  { date: "2024-04-29", newCustomers: 18, activeReminders: 54, customerActivity: 104 },
  { date: "2024-04-30", newCustomers: 11, activeReminders: 43, customerActivity: 84 },
  { date: "2024-05-01", newCustomers: 13, activeReminders: 48, customerActivity: 93 },
  { date: "2024-05-02", newCustomers: 8, activeReminders: 38, customerActivity: 75 },
  { date: "2024-05-03", newCustomers: 15, activeReminders: 50, customerActivity: 96 },
  { date: "2024-05-04", newCustomers: 10, activeReminders: 41, customerActivity: 80 },
  { date: "2024-05-05", newCustomers: 6, activeReminders: 35, customerActivity: 69 },
  { date: "2024-05-06", newCustomers: 17, activeReminders: 52, customerActivity: 100 },
  { date: "2024-05-07", newCustomers: 12, activeReminders: 45, customerActivity: 87 },
  { date: "2024-05-08", newCustomers: 14, activeReminders: 49, customerActivity: 94 },
  { date: "2024-05-09", newCustomers: 9, activeReminders: 40, customerActivity: 78 },
  { date: "2024-05-10", newCustomers: 16, activeReminders: 51, customerActivity: 98 },
  { date: "2024-05-11", newCustomers: 11, activeReminders: 44, customerActivity: 85 },
  { date: "2024-05-12", newCustomers: 7, activeReminders: 37, customerActivity: 71 },
  { date: "2024-05-13", newCustomers: 13, activeReminders: 46, customerActivity: 89 },
  { date: "2024-05-14", newCustomers: 18, activeReminders: 53, customerActivity: 102 },
  { date: "2024-05-15", newCustomers: 10, activeReminders: 42, customerActivity: 82 },
  { date: "2024-05-16", newCustomers: 15, activeReminders: 48, customerActivity: 92 },
  { date: "2024-05-17", newCustomers: 8, activeReminders: 39, customerActivity: 76 },
  { date: "2024-05-18", newCustomers: 12, activeReminders: 45, customerActivity: 86 },
  { date: "2024-05-19", newCustomers: 6, activeReminders: 34, customerActivity: 66 },
  { date: "2024-05-20", newCustomers: 14, activeReminders: 47, customerActivity: 90 },
  { date: "2024-05-21", newCustomers: 17, activeReminders: 50, customerActivity: 97 },
  { date: "2024-05-22", newCustomers: 9, activeReminders: 41, customerActivity: 79 },
  { date: "2024-05-23", newCustomers: 11, activeReminders: 43, customerActivity: 83 },
  { date: "2024-05-24", newCustomers: 16, activeReminders: 49, customerActivity: 95 },
  { date: "2024-05-25", newCustomers: 13, activeReminders: 46, customerActivity: 88 },
  { date: "2024-05-26", newCustomers: 7, activeReminders: 36, customerActivity: 70 },
  { date: "2024-05-27", newCustomers: 15, activeReminders: 48, customerActivity: 93 },
  { date: "2024-05-28", newCustomers: 10, activeReminders: 42, customerActivity: 81 },
  { date: "2024-05-29", newCustomers: 18, activeReminders: 52, customerActivity: 99 },
  { date: "2024-05-30", newCustomers: 12, activeReminders: 44, customerActivity: 85 },
  { date: "2024-05-31", newCustomers: 8, activeReminders: 38, customerActivity: 74 },
  { date: "2024-06-01", newCustomers: 14, activeReminders: 47, customerActivity: 91 },
  { date: "2024-06-02", newCustomers: 11, activeReminders: 43, customerActivity: 84 },
  { date: "2024-06-03", newCustomers: 6, activeReminders: 35, customerActivity: 68 },
  { date: "2024-06-04", newCustomers: 17, activeReminders: 50, customerActivity: 96 },
  { date: "2024-06-05", newCustomers: 13, activeReminders: 45, customerActivity: 87 },
  { date: "2024-06-06", newCustomers: 9, activeReminders: 40, customerActivity: 78 },
  { date: "2024-06-07", newCustomers: 15, activeReminders: 48, customerActivity: 92 },
  { date: "2024-06-08", newCustomers: 10, activeReminders: 41, customerActivity: 80 },
  { date: "2024-06-09", newCustomers: 16, activeReminders: 49, customerActivity: 94 },
  { date: "2024-06-10", newCustomers: 7, activeReminders: 37, customerActivity: 72 },
  { date: "2024-06-11", newCustomers: 12, activeReminders: 44, customerActivity: 86 },
  { date: "2024-06-12", newCustomers: 18, activeReminders: 51, customerActivity: 98 },
  { date: "2024-06-13", newCustomers: 8, activeReminders: 39, customerActivity: 76 },
  { date: "2024-06-14", newCustomers: 14, activeReminders: 46, customerActivity: 89 },
  { date: "2024-06-15", newCustomers: 11, activeReminders: 42, customerActivity: 82 },
  { date: "2024-06-16", newCustomers: 6, activeReminders: 34, customerActivity: 67 },
  { date: "2024-06-17", newCustomers: 15, activeReminders: 47, customerActivity: 90 },
  { date: "2024-06-18", newCustomers: 13, activeReminders: 45, customerActivity: 87 },
  { date: "2024-06-19", newCustomers: 9, activeReminders: 40, customerActivity: 79 },
  { date: "2024-06-20", newCustomers: 17, activeReminders: 50, customerActivity: 97 },
  { date: "2024-06-21", newCustomers: 10, activeReminders: 43, customerActivity: 83 },
  { date: "2024-06-22", newCustomers: 12, activeReminders: 44, customerActivity: 85 },
  { date: "2024-06-23", newCustomers: 16, activeReminders: 48, customerActivity: 93 },
  { date: "2024-06-24", newCustomers: 7, activeReminders: 36, customerActivity: 71 },
  { date: "2024-06-25", newCustomers: 14, activeReminders: 46, customerActivity: 88 },
  { date: "2024-06-26", newCustomers: 11, activeReminders: 42, customerActivity: 81 },
  { date: "2024-06-27", newCustomers: 18, activeReminders: 51, customerActivity: 99 },
  { date: "2024-06-28", newCustomers: 8, activeReminders: 38, customerActivity: 75 },
  { date: "2024-06-29", newCustomers: 13, activeReminders: 45, customerActivity: 86 },
  { date: "2024-06-30", newCustomers: 15, activeReminders: 47, customerActivity: 91 },
]

const chartConfig = {
  newCustomers: {
    label: "New Customers",
    color: "var(--primary)",
  },
  activeReminders: {
    label: "Active Reminders",
    color: "var(--secondary)",
  },
  customerActivity: {
    label: "Customer Activity",
    color: "var(--accent)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Customer Service Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Track customer growth, reminders, and activity over time
          </span>
          <span className="@[540px]/card:hidden">Customer metrics</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <AreaChart data={filteredData} height={300}>
            <defs>
              <linearGradient id="newCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="activeReminders" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--secondary)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor="var(--secondary)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="customerActivity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--accent)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor="var(--accent)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
              className="text-xs text-muted-foreground"
            />
            <Area
              dataKey="newCustomers"
              stroke="var(--primary)"
              fill="url(#newCustomers)"
              strokeWidth={2}
              type="monotone"
            />
            <Area
              dataKey="activeReminders"
              stroke="var(--secondary)"
              fill="url(#activeReminders)"
              strokeWidth={2}
              type="monotone"
            />
            <Area
              dataKey="customerActivity"
              stroke="var(--accent)"
              fill="url(#customerActivity)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </div>
      </CardContent>
    </Card>
  )
}

