import useSWR, { mutate } from 'swr';
import { customerAPI, Customer, CreateCustomerRequest, CreateAddressRequest, APIError } from '../api';
import { useAuth } from '@/components/auth-provider';

// SWR fetcher function
const fetcher = async () => {
  try {
    return await customerAPI.getAll();
  } catch (error) {
    throw error;
  }
};

// Hook for fetching all customers
export function useCustomers() {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshCustomers } = useSWR<Customer[]>(
    // Only fetch when user is authenticated
    user ? 'customers' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      // Don't revalidate if auth is still loading
      revalidateIfStale: !authLoading,
    }
  );

  return {
    customers: data || [],
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    refreshCustomers,
  };
}

// Hook for searching customers
export function useCustomerSearch(query: string) {
  const { user, loading: authLoading } = useAuth();
  const { customers } = useCustomers(); // Get all customers for fallback search

  const { data, error, isLoading } = useSWR<Customer[]>(
    // Only search when user is authenticated and query is provided
    user && query ? `customers-search-${query}` : null,
    async () => {
      try {
        return await customerAPI.search(query);
      } catch (apiError) {
        console.error(
          "API search failed, falling back to client-side search:",
          apiError
        );
        // Fallback to client-side search
        const searchTerm = query.toLowerCase();
        return customers.filter(
          (customer) =>
            customer.firstName.toLowerCase().includes(searchTerm) ||
            customer.lastName.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.phones?.some((phone) =>
              phone.phoneNumber.toLowerCase().includes(searchTerm)
            )
        );
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  return {
    searchResults: data || [],
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
  };
}

// Hook for a single customer
export function useCustomer(customerId: string) {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshCustomer } = useSWR<Customer | undefined>(
    // Only fetch when user is authenticated and customerId is provided
    user && customerId ? `customer/${customerId}` : null,
    async () => {
      const customers = await customerAPI.getAll();
      return customers.find(c => c.id === customerId);
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    customer: data,
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    refreshCustomer,
  };
}

// Hook for customer mutations
export function useCustomerMutations() {
  const { user } = useAuth();
  
  const createCustomer = async (data: CreateCustomerRequest) => {
    if (!user) {
      throw new Error('User must be authenticated to create customers');
    }
    
    try {
      const newCustomer = await customerAPI.create(data);
      // Update the customers list
      await mutate('customers', (customers: Customer[] = []) => 
        [...customers, newCustomer], false
      );
      return { success: true, customer: newCustomer };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete customers');
    }
    
    try {
      await customerAPI.delete(customerId);
      // Remove from the customers list
      await mutate('customers', (customers: Customer[] = []) => 
        customers.filter(c => c.id !== customerId), false
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  return {
    createCustomer,
    deleteCustomer,
  };
}

// Hook for customer notes
export function useCustomerNotes(customerId: string) {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshNotes } = useSWR(
    // Only fetch when user is authenticated and customerId is provided
    user && customerId ? `customer/${customerId}/notes` : null,
    () => customerAPI.getNotes(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addNote = async (note: string) => {
    if (!user) {
      throw new Error('User must be authenticated to add notes');
    }
    
    try {
      const newNote = await customerAPI.addNote(customerId, { note });
      await refreshNotes();
      return { success: true, note: newNote };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const updateNote = async (noteId: string, note: string) => {
    if (!user) {
      throw new Error('User must be authenticated to update notes');
    }
    
    try {
      const updatedNote = await customerAPI.updateNote(customerId, noteId, { note });
      await refreshNotes();
      return { success: true, note: updatedNote };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete notes');
    }
    
    try {
      await customerAPI.deleteNote(customerId, noteId);
      await refreshNotes();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  return {
    notes: data || [],
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
  };
}

// Hook for customer reminders
export function useCustomerReminders(customerId: string) {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshReminders } = useSWR(
    // Only fetch when user is authenticated and customerId is provided
    user && customerId ? `customer/${customerId}/reminders` : null,
    () => customerAPI.getReminders(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addReminder = async (data: {
    description: string;
    dueDate: string;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    if (!user) {
      throw new Error('User must be authenticated to add reminders');
    }
    
    try {
      const newReminder = await customerAPI.addReminder(customerId, data);
      await refreshReminders();
      return { success: true, reminder: newReminder };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const completeReminder = async (reminderId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to complete reminders');
    }
    
    try {
      const updatedReminder = await customerAPI.completeReminder(customerId, reminderId);
      await refreshReminders();
      return { success: true, reminder: updatedReminder };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const reopenReminder = async (reminderId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to reopen reminders');
    }
    
    try {
      const updatedReminder = await customerAPI.reopenReminder(customerId, reminderId);
      await refreshReminders();
      return { success: true, reminder: updatedReminder };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteReminder = async (reminderId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete reminders');
    }
    
    try {
      await customerAPI.deleteReminder(customerId, reminderId);
      await refreshReminders();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  return {
    reminders: data || [],
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    addReminder,
    completeReminder,
    reopenReminder,
    deleteReminder,
    refreshReminders,
  };
}

// Hook for customer phones
export function useCustomerPhones(customerId: string) {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshPhones } = useSWR(
    // Only fetch when user is authenticated and customerId is provided
    user && customerId ? `customer/${customerId}/phones` : null,
    () => customerAPI.getPhones(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addPhone = async (data: { phoneNumber: string; designation: string }) => {
    if (!user) {
      throw new Error('User must be authenticated to add phones');
    }
    
    try {
      const newPhone = await customerAPI.addPhone(customerId, data);
      await refreshPhones();
      return { success: true, phone: newPhone };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const updatePhone = async (phoneId: string, data: { phoneNumber: string; designation: string }) => {
    if (!user) {
      throw new Error('User must be authenticated to update phones');
    }
    
    try {
      const updatedPhone = await customerAPI.updatePhone(customerId, phoneId, data);
      await refreshPhones();
      return { success: true, phone: updatedPhone };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deletePhone = async (phoneId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete phones');
    }
    
    try {
      await customerAPI.deletePhone(customerId, phoneId);
      await refreshPhones();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  return {
    phones: data || [],
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    addPhone,
    updatePhone,
    deletePhone,
    refreshPhones,
  };
}

// Hook for customer addresses
export function useCustomerAddresses(customerId: string) {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate: refreshAddresses } = useSWR(
    // Only fetch when user is authenticated and customerId is provided
    user && customerId ? `customer/${customerId}/addresses` : null,
    () => customerAPI.getAddresses(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addAddress = async (data: CreateAddressRequest) => {
    if (!user) {
      throw new Error('User must be authenticated to add addresses');
    }
    
    try {
      const newAddress = await customerAPI.addAddress(customerId, data);
      await refreshAddresses();
      return { success: true, address: newAddress };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const updateAddress = async (addressId: string, data: CreateAddressRequest) => {
    if (!user) {
      throw new Error('User must be authenticated to update addresses');
    }
    
    try {
      const updatedAddress = await customerAPI.updateAddress(customerId, addressId, data);
      await refreshAddresses();
      return { success: true, address: updatedAddress };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete addresses');
    }
    
    try {
      await customerAPI.deleteAddress(customerId, addressId);
      await refreshAddresses();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  return {
    addresses: data || [],
    isLoading: authLoading || isLoading,
    error: error as APIError | null,
    addAddress,
    updateAddress,
    deleteAddress,
    refreshAddresses,
  };
} 