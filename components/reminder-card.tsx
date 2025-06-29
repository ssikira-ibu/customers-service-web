"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/api-utils";
import Link from "next/link";
import {
  IconCalendar,
  IconCheck,
  IconTrash,
  IconUser,
  IconMail,
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
        {/* Todo-style checkbox */}
        <div className="flex-shrink-0 mt-0.5">
          <button
            onClick={() =>
              reminder.completed
                ? onReopen(reminder.customerId, reminder.id)
                : onComplete(reminder.customerId, reminder.id)
            }
            disabled={loadingActions.has(
              `${reminder.customerId}-${reminder.id}-${
                reminder.completed ? "reopen" : "complete"
              }`
            )}
            className={`group/checkbox relative flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all hover:scale-105 ${
              reminder.completed
                ? "bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600"
                : isOverdue
                ? "border-red-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                : isDueToday
                ? "border-orange-300 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                : "border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50"
            } disabled:opacity-50 disabled:hover:scale-100`}
          >
            {loadingActions.has(
              `${reminder.customerId}-${reminder.id}-${
                reminder.completed ? "reopen" : "complete"
              }`
            ) ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : reminder.completed ? (
              <IconCheck className="h-3 w-3" />
            ) : (
              <div className="opacity-0 group-hover/checkbox:opacity-100 transition-opacity">
                <IconCheck className="h-3 w-3" />
              </div>
            )}
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="mb-4">
                <h3
                  className={`text-sm font-medium leading-5 ${
                    reminder.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {reminder.description}
                </h3>
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0 h-4 font-medium border ${
                    badgeStyles.priority[reminder.priority]
                  }`}
                >
                  {reminder.priority.charAt(0).toUpperCase() +
                    reminder.priority.slice(1)}
                </Badge>
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

            {/* Actions - Only delete button on the right */}
            <div className="flex items-start pt-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(reminder.customerId, reminder.id)}
                disabled={loadingActions.has(
                  `${reminder.customerId}-${reminder.id}-delete`
                )}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
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