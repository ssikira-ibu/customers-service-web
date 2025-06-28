"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/api-utils";
import Link from "next/link";
import {
  IconCalendar,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconCheck,
  IconRotate,
  IconTrash,
  IconUser,
  IconMail,
  IconExternalLink,
} from "@tabler/icons-react";

interface ReminderCardProps {
  reminder: {
    id: string;
    description: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    completed: boolean;
    customerId: string;
    customerName: string;
    customerEmail: string;
  };
  onComplete: (customerId: string, reminderId: string) => void;
  onReopen: (customerId: string, reminderId: string) => void;
  onDelete: (customerId: string, reminderId: string) => void;
  loadingActions: Set<string>;
  showCustomerInfo?: boolean; // New prop to control customer info display
}

export function ReminderCard({
  reminder,
  onComplete,
  onReopen,
  onDelete,
  loadingActions,
  showCustomerInfo = true, // Default to true for backwards compatibility
}: ReminderCardProps) {
  const isOverdue =
    !reminder.completed && new Date(reminder.dueDate) < new Date();
  const isDueToday =
    !reminder.completed &&
    new Date(reminder.dueDate).toDateString() === new Date().toDateString();

  // Modern badge design system
  const badgeStyles = {
    // Priority badges
    priority: {
      high: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
      medium:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
      low: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50",
    },
    // Status badges
    status: {
      completed:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
      overdue:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
      today:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50",
    },
  };

  return (
    <div
      className={`group relative rounded-lg border bg-card p-3 transition-all hover:shadow-sm hover:border-border/60 ${
        reminder.completed ? "opacity-60" : ""
      }`}
    >
      {/* Priority indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
          reminder.priority === "high"
            ? "bg-red-500"
            : reminder.priority === "medium"
            ? "bg-amber-500"
            : "bg-blue-500"
        }`}
      />

      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {reminder.completed ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <IconCircleCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          ) : isOverdue ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <IconAlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
          ) : isDueToday ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <IconClock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <IconClock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title and badges */}
              <div className="flex items-start gap-2 mb-1">
                <h3
                  className={`text-sm font-medium leading-5 flex-1 ${
                    reminder.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {reminder.description}
                </h3>

                {/* Compact badges */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0 h-5 font-medium border ${
                      badgeStyles.priority[reminder.priority]
                    }`}
                  >
                    {reminder.priority}
                  </Badge>

                  {reminder.completed && (
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.completed}`}
                    >
                      Done
                    </Badge>
                  )}
                  {isOverdue && !reminder.completed && (
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.overdue}`}
                    >
                      Overdue
                    </Badge>
                  )}
                  {isDueToday && !reminder.completed && (
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.today}`}
                    >
                      Today
                    </Badge>
                  )}
                </div>
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <IconCalendar className="h-3 w-3" />
                  <span>{formatDate(reminder.dueDate)}</span>
                </div>
                {showCustomerInfo && (
                  <>
                    <div className="flex items-center gap-1">
                      <IconUser className="h-3 w-3" />
                      <Link href={`/customers/${reminder.customerId}`}>
                        <button className="text-muted-foreground hover:text-foreground hover:underline transition-colors truncate">
                          {reminder.customerName}
                        </button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconMail className="h-3 w-3" />
                      <a href={`mailto:${reminder.customerEmail}`}>
                        <button className="text-muted-foreground hover:text-foreground hover:underline transition-colors truncate">
                          {reminder.customerEmail}
                        </button>
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!reminder.completed ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onComplete(reminder.customerId, reminder.id)}
                  disabled={loadingActions.has(
                    `${reminder.customerId}-${reminder.id}-complete`
                  )}
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-50"
                >
                  {loadingActions.has(
                    `${reminder.customerId}-${reminder.id}-complete`
                  ) ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  ) : (
                    <IconCheck className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReopen(reminder.customerId, reminder.id)}
                  disabled={loadingActions.has(
                    `${reminder.customerId}-${reminder.id}-reopen`
                  )}
                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50"
                >
                  {loadingActions.has(
                    `${reminder.customerId}-${reminder.id}-reopen`
                  ) ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <IconRotate className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(reminder.customerId, reminder.id)}
                disabled={loadingActions.has(
                  `${reminder.customerId}-${reminder.id}-delete`
                )}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
              >
                {loadingActions.has(
                  `${reminder.customerId}-${reminder.id}-delete`
                ) ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <IconTrash className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}