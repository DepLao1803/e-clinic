"use client"

import { Icon } from "@iconify/react/dist/iconify.js"
import CardBox from "../shared/CardBox"

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color?: "primary" | "success" | "warning" | "error" | "secondary"
  trend?: { value: string; positive: boolean }
  hint?: string
}

const colorMap: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  error: { bg: "bg-error/10", text: "text-error" },
  secondary: { bg: "bg-secondary/10", text: "text-secondary" },
}

export default function StatCard({
  title,
  value,
  icon,
  color = "primary",
  trend,
  hint,
}: StatCardProps) {
  const c = colorMap[color] ?? colorMap.primary
  return (
    <CardBox className="h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <h4 className="text-2xl font-bold mb-1">{value}</h4>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                trend.positive ? "text-success" : "text-error"
              }`}
            >
              <Icon
                icon={trend.positive ? "solar:arrow-up-linear" : "solar:arrow-down-linear"}
                width={14}
                height={14}
              />
              {trend.value}
            </span>
          )}
          {hint && !trend && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className={`flex items-center justify-center rounded-xl w-12 h-12 shrink-0 ${c.bg} ${c.text}`}>
          <Icon icon={icon} width={24} height={24} />
        </div>
      </div>
    </CardBox>
  )
}
