import useSWR, { mutate } from 'swr';
import { customerAPI, Customer, CreateCustomerRequest, APIError } from '../api';

// SWR fetcher function
const fetcher = async (url: string) => {
  try {
    return await customerAPI.getAll();
  } catch (error) {
    throw error;
  }
};

// Hook for fetching all customers
export function useCustomers() {
  const { data, error, isLoading, mutate: refreshCustomers } = useSWR<Customer[]>(
    'customers',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    customers: data || [],
    isLoading,
    error: error as APIError | null,
    refreshCustomers,
  };
}

// Hook for searching customers
export function useCustomerSearch(query: string) {
  const { data, error, isLoading } = useSWR<Customer[]>(
    query ? `customers/search/${query}` : null,
    () => customerAPI.search(query),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  return {
    searchResults: data || [],
    isLoading,
    error: error as APIError | null,
  };
}

// Hook for a single customer
export function useCustomer(customerId: string) {
  const { data, error, isLoading, mutate: refreshCustomer } = useSWR<Customer>(
    customerId ? `customer/${customerId}` : null,
    () => customerAPI.getAll().then(customers => 
      customers.find(c => c.id === customerId)
    ),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    customer: data,
    isLoading,
    error: error as APIError | null,
    refreshCustomer,
  };
}

// Hook for customer mutations
export function useCustomerMutations() {
  const createCustomer = async (data: CreateCustomerRequest) => {
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
  const { data, error, isLoading, mutate: refreshNotes } = useSWR(
    customerId ? `customer/${customerId}/notes` : null,
    () => customerAPI.getNotes(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addNote = async (note: string) => {
    try {
      const newNote = await customerAPI.addNote(customerId, { note });
      await refreshNotes();
      return { success: true, note: newNote };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const updateNote = async (noteId: string, note: string) => {
    try {
      const updatedNote = await customerAPI.updateNote(customerId, noteId, { note });
      await refreshNotes();
      return { success: true, note: updatedNote };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteNote = async (noteId: string) => {
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
    isLoading,
    error: error as APIError | null,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
  };
}

// Hook for customer reminders
export function useCustomerReminders(customerId: string) {
  const { data, error, isLoading, mutate: refreshReminders } = useSWR(
    customerId ? `customer/${customerId}/reminders` : null,
    () => customerAPI.getReminders(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addReminder = async (data: {
    title: string;
    description: string;
    dueDate: string;
    priority?: 'low' | 'medium' | 'high';
  }) => {
    try {
      const newReminder = await customerAPI.addReminder(customerId, data);
      await refreshReminders();
      return { success: true, reminder: newReminder };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const completeReminder = async (reminderId: string) => {
    try {
      const updatedReminder = await customerAPI.completeReminder(customerId, reminderId);
      await refreshReminders();
      return { success: true, reminder: updatedReminder };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const reopenReminder = async (reminderId: string) => {
    try {
      const updatedReminder = await customerAPI.reopenReminder(customerId, reminderId);
      await refreshReminders();
      return { success: true, reminder: updatedReminder };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteReminder = async (reminderId: string) => {
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
    isLoading,
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
  const { data, error, isLoading, mutate: refreshPhones } = useSWR(
    customerId ? `customer/${customerId}/phones` : null,
    () => customerAPI.getPhones(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addPhone = async (data: { phoneNumber: string; designation: string }) => {
    try {
      const newPhone = await customerAPI.addPhone(customerId, data);
      await refreshPhones();
      return { success: true, phone: newPhone };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const updatePhone = async (phoneId: string, data: { phoneNumber: string; designation: string }) => {
    try {
      const updatedPhone = await customerAPI.updatePhone(customerId, phoneId, data);
      await refreshPhones();
      return { success: true, phone: updatedPhone };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deletePhone = async (phoneId: string) => {
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
    isLoading,
    error: error as APIError | null,
    addPhone,
    updatePhone,
    deletePhone,
    refreshPhones,
  };
}

// Hook for customer addresses
export function useCustomerAddresses(customerId: string) {
  const { data, error, isLoading, mutate: refreshAddresses } = useSWR(
    customerId ? `customer/${customerId}/addresses` : null,
    () => customerAPI.getAddresses(customerId),
    {
      revalidateOnFocus: false,
    }
  );

  const addAddress = async (data: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
  }) => {
    try {
      const newAddress = await customerAPI.addAddress(customerId, data);
      await refreshAddresses();
      return { success: true, address: newAddress };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const updateAddress = async (addressId: string, data: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
  }) => {
    try {
      const updatedAddress = await customerAPI.updateAddress(customerId, addressId, data);
      await refreshAddresses();
      return { success: true, address: updatedAddress };
    } catch (error) {
      return { success: false, error: error as APIError };
    }
  };

  const deleteAddress = async (addressId: string) => {
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
    isLoading,
    error: error as APIError | null,
    addAddress,
    updateAddress,
    deleteAddress,
    refreshAddresses,
  };
} 