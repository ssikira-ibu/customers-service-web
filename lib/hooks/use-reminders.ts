import useSWR from 'swr';
import { useAuth } from '@/components/auth-provider';
import { reminderAPI } from '../api';

// Hook for fetching all reminders with filtering
export function useAllReminders(params?: {
  status?: 'active' | 'overdue' | 'completed' | 'all';
  include?: 'customer';
}) {
  const { user, loading: authLoading } = useAuth();

  const { data: reminders, error, isLoading, mutate } = useSWR(
    user ? ['reminders', params] : null,
    () => reminderAPI.getAll(params)
  );

  // Transform reminders to include computed properties
  const transformedReminders = reminders?.map(reminder => ({
    ...reminder,
    completed: reminder.dateCompleted !== null,
    customerId: reminder.customer?.id || '',
    customerName: reminder.customer ? `${reminder.customer.firstName} ${reminder.customer.lastName}` : 'Unknown Customer',
    customerEmail: reminder.customer?.email || '',
    title: reminder.description, // For backward compatibility with existing UI
  })) || [];

  // Sort reminders by priority, due date, and completion status
  const sortedReminders = transformedReminders.sort((a, b) => {
    // First, sort by completion status (incomplete first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then by priority (high first)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // Finally by due date (earliest first)
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Filter reminders based on status
  const activeReminders = sortedReminders.filter(r => !r.completed);
  const completedReminders = sortedReminders.filter(r => r.completed);
  const overdueReminders = activeReminders.filter(r => new Date(r.dueDate) < new Date());
  const upcomingReminders = activeReminders.filter(r => new Date(r.dueDate) >= new Date());

  return {
    allReminders: sortedReminders,
    activeReminders,
    completedReminders,
    overdueReminders,
    upcomingReminders,
    isLoading: authLoading || isLoading,
    error,
    mutate,
  };
}

// Hook for reminder statistics
export function useReminderStats() {
  const { user, loading: authLoading } = useAuth();

  const { data: analytics, error, isLoading } = useSWR(
    user ? 'reminder-analytics' : null,
    () => reminderAPI.getAnalytics()
  );

  const stats = analytics || {
    counts: {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
    },
    completionRate: 0,
  };

  return {
    ...stats.counts,
    completionRate: stats.completionRate * 100, // Convert to percentage
    isLoading: authLoading || isLoading,
    error,
  };
}

// Hook for reminder actions
export function useReminderActions() {
  const { mutate } = useAllReminders();

  const completeReminder = async (customerId: string, reminderId: string) => {
    try {
      await reminderAPI.updateReminder(customerId, reminderId, {
        dateCompleted: new Date().toISOString()
      });
      await mutate(); // Refresh the reminders list
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const reopenReminder = async (customerId: string, reminderId: string) => {
    try {
      await reminderAPI.updateReminder(customerId, reminderId, {
        dateCompleted: null
      });
      await mutate(); // Refresh the reminders list
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const deleteReminder = async (customerId: string, reminderId: string) => {
    try {
      // Note: We still need to use the customerAPI for deletion since it's customer-specific
      const { customerAPI } = await import('../api');
      await customerAPI.deleteReminder(customerId, reminderId);
      await mutate(); // Refresh the reminders list
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    completeReminder,
    reopenReminder,
    deleteReminder,
  };
} 