import { authenticatedFetch } from './auth';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types for API requests and responses
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  phones: Phone[];
  addresses: Address[];
  notes: Note[];
  reminders?: Reminder[];
}

export interface Phone {
  id: string;
  phoneNumber: string;
  designation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  dateCompleted: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phones?: {
    phoneNumber: string;
    designation: string;
  }[];
  addresses?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
  }[];
}

export interface CreatePhoneRequest {
  phoneNumber: string;
  designation: string;
}

export interface CreateAddressRequest {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
}

export interface CreateNoteRequest {
  note: string;
}

export interface CreateReminderRequest {
  description: string;
  dueDate: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  photoURL?: string;
  disabled: boolean;
  lastSignInTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderAnalytics {
  counts: {
    total: number;
    active: number;
    overdue: number;
    completed: number;
  };
  completionRate: number;
}

// API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errors: any[] = [];

    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
      if (errorData.errors) {
        errors = errorData.errors;
      }
    } catch {
      // If we can't parse the error response, use the default message
    }

    throw new APIError(errorMessage, response.status, errors);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Customer API functions
export const customerAPI = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers`);
    return handleResponse<Customer[]>(response);
  },

  // Create a new customer
  async create(data: CreateCustomerRequest): Promise<Customer> {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<Customer>(response);
  },

  // Search customers
  async search(query: string): Promise<Customer[]> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/search?query=${encodeURIComponent(query)}`
    );
    return handleResponse<Customer[]>(response);
  },

  // Delete a customer
  async delete(customerId: string): Promise<void> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}`,
      {
        method: 'DELETE',
      }
    );
    return handleResponse<void>(response);
  },

  // Phone management
  async getPhones(customerId: string): Promise<Phone[]> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/phones`
    );
    return handleResponse<Phone[]>(response);
  },

  async addPhone(customerId: string, data: CreatePhoneRequest): Promise<Phone> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/phones`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Phone>(response);
  },

  async updatePhone(
    customerId: string,
    phoneId: string,
    data: CreatePhoneRequest
  ): Promise<Phone> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/phones/${phoneId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Phone>(response);
  },

  async deletePhone(customerId: string, phoneId: string): Promise<void> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/phones/${phoneId}`,
      {
        method: 'DELETE',
      }
    );
    return handleResponse<void>(response);
  },

  // Address management
  async getAddresses(customerId: string): Promise<Address[]> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/addresses`
    );
    return handleResponse<Address[]>(response);
  },

  async addAddress(customerId: string, data: CreateAddressRequest): Promise<Address> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/addresses`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Address>(response);
  },

  async updateAddress(
    customerId: string,
    addressId: string,
    data: CreateAddressRequest
  ): Promise<Address> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/addresses/${addressId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Address>(response);
  },

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/addresses/${addressId}`,
      {
        method: 'DELETE',
      }
    );
    return handleResponse<void>(response);
  },

  // Note management
  async getNotes(customerId: string): Promise<Note[]> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/notes`
    );
    return handleResponse<Note[]>(response);
  },

  async addNote(customerId: string, data: CreateNoteRequest): Promise<Note> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/notes`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Note>(response);
  },

  async updateNote(
    customerId: string,
    noteId: string,
    data: CreateNoteRequest
  ): Promise<Note> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/notes/${noteId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Note>(response);
  },

  async deleteNote(customerId: string, noteId: string): Promise<void> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/notes/${noteId}`,
      {
        method: 'DELETE',
      }
    );
    return handleResponse<void>(response);
  },

  // Reminder management
  async getReminders(customerId: string): Promise<Reminder[]> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/reminders`
    );
    return handleResponse<Reminder[]>(response);
  },

  async addReminder(customerId: string, data: CreateReminderRequest): Promise<Reminder> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/reminders`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Reminder>(response);
  },

  async completeReminder(customerId: string, reminderId: string): Promise<Reminder> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/reminders/${reminderId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          dateCompleted: new Date().toISOString()
        }),
      }
    );
    return handleResponse<Reminder>(response);
  },

  async reopenReminder(customerId: string, reminderId: string): Promise<Reminder> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/reminders/${reminderId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          dateCompleted: null
        }),
      }
    );
    return handleResponse<Reminder>(response);
  },

  async deleteReminder(customerId: string, reminderId: string): Promise<void> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/reminders/${reminderId}`,
      {
        method: 'DELETE',
      }
    );
    return handleResponse<void>(response);
  },
};

// User API functions
export const userAPI = {
  // Get current user information
  async getCurrentUser(): Promise<User> {
    const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);
    return handleResponse<User>(response);
  },
};

// Health check
export const healthAPI = {
  async check(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<{ status: string; timestamp: string }>(response);
  },
};

// Global Reminder API functions
export const reminderAPI = {
  // Get global analytics for all reminders
  async getAnalytics(): Promise<ReminderAnalytics> {
    const response = await authenticatedFetch(`${API_BASE_URL}/reminders/analytics`);
    return handleResponse<ReminderAnalytics>(response);
  },

  // Get global list of reminders with filtering
  async getAll(params?: {
    status?: 'active' | 'overdue' | 'completed' | 'all';
    include?: 'customer';
  }): Promise<Reminder[]> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      searchParams.append('status', params.status);
    }
    if (params?.include) {
      searchParams.append('include', params.include);
    }
    
    const url = `${API_BASE_URL}/reminders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await authenticatedFetch(url);
    return handleResponse<Reminder[]>(response);
  },

  // Update reminder (partial update)
  async updateReminder(customerId: string, reminderId: string, data: Partial<{
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    dateCompleted: string | null;
  }>): Promise<Reminder> {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/reminders/${reminderId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return handleResponse<Reminder>(response);
  },
}; 