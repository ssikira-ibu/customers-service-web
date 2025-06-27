# Customer Service API Integration

This directory contains all the API integration code for the customer service application, including API clients, React hooks, and utility functions.

## Overview

The API integration is built around:
- **Firebase Authentication** for user management
- **RESTful API** for customer data management
- **SWR** for data fetching and caching
- **TypeScript** for type safety

## File Structure

```
lib/
├── api.ts                 # Main API client with all endpoints
├── auth.ts               # Firebase authentication utilities
├── firebase.ts           # Firebase configuration
├── utils.ts              # General utilities
├── utils/
│   └── api-utils.ts      # API-specific utilities and error handling
├── hooks/
│   ├── index.ts          # Hook exports
│   ├── use-customers.ts  # Customer-related hooks
│   └── use-user.ts       # User-related hooks
└── README.md             # This file
```

## API Client (`lib/api.ts`)

The main API client provides functions for all customer service operations:

### Customer Operations

```typescript
import { customerAPI } from '@/lib/api'

// Get all customers
const customers = await customerAPI.getAll()

// Create a new customer
const newCustomer = await customerAPI.create({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phones: [{ phoneNumber: "555-1234", designation: "mobile" }],
  addresses: [{
    street: "123 Main St",
    city: "Anytown",
    state: "CA",
    postalCode: "12345",
    country: "USA",
    addressType: "home"
  }]
})

// Search customers
const searchResults = await customerAPI.search("john")

// Delete a customer
await customerAPI.delete("customer-id")
```

### Phone Management

```typescript
// Get customer phones
const phones = await customerAPI.getPhones("customer-id")

// Add phone
const newPhone = await customerAPI.addPhone("customer-id", {
  phoneNumber: "555-5678",
  designation: "work"
})

// Update phone
const updatedPhone = await customerAPI.updatePhone("customer-id", "phone-id", {
  phoneNumber: "555-9999",
  designation: "mobile"
})

// Delete phone
await customerAPI.deletePhone("customer-id", "phone-id")
```

### Address Management

```typescript
// Get customer addresses
const addresses = await customerAPI.getAddresses("customer-id")

// Add address
const newAddress = await customerAPI.addAddress("customer-id", {
  street: "456 Oak St",
  city: "Somewhere",
  state: "NY",
  postalCode: "54321",
  country: "USA",
  addressType: "work"
})

// Update address
const updatedAddress = await customerAPI.updateAddress("customer-id", "address-id", {
  street: "789 Pine St",
  city: "Elsewhere",
  state: "TX",
  postalCode: "67890",
  country: "USA",
  addressType: "billing"
})

// Delete address
await customerAPI.deleteAddress("customer-id", "address-id")
```

### Note Management

```typescript
// Get customer notes
const notes = await customerAPI.getNotes("customer-id")

// Add note
const newNote = await customerAPI.addNote("customer-id", {
  note: "Customer prefers morning appointments"
})

// Update note
const updatedNote = await customerAPI.updateNote("customer-id", "note-id", {
  note: "Customer prefers morning appointments and is allergic to peanuts"
})

// Delete note
await customerAPI.deleteNote("customer-id", "note-id")
```

### Reminder Management

```typescript
// Get customer reminders
const reminders = await customerAPI.getReminders("customer-id")

// Add reminder
const newReminder = await customerAPI.addReminder("customer-id", {
  title: "Follow up call",
  description: "Call customer about recent purchase",
  dueDate: "2024-01-15T10:00:00Z",
  priority: "high"
})

// Complete reminder
const completedReminder = await customerAPI.completeReminder("customer-id", "reminder-id")

// Reopen reminder
const reopenedReminder = await customerAPI.reopenReminder("customer-id", "reminder-id")

// Delete reminder
await customerAPI.deleteReminder("customer-id", "reminder-id")
```

## React Hooks

### Customer Hooks (`lib/hooks/use-customers.ts`)

```typescript
import { useCustomers, useCustomerSearch, useCustomerMutations } from '@/lib/hooks'

function CustomerList() {
  // Get all customers with automatic caching and revalidation
  const { customers, isLoading, error, refreshCustomers } = useCustomers()

  // Search customers
  const { searchResults, isLoading: searchLoading } = useCustomerSearch("john")

  // Customer mutations
  const { createCustomer, deleteCustomer } = useCustomerMutations()

  const handleCreateCustomer = async (data) => {
    const result = await createCustomer(data)
    if (result.success) {
      console.log("Customer created:", result.customer)
    } else {
      console.error("Error:", result.error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>
          {customer.firstName} {customer.lastName}
        </div>
      ))}
    </div>
  )
}
```

### Customer Detail Hooks

```typescript
import { 
  useCustomerNotes, 
  useCustomerReminders, 
  useCustomerPhones, 
  useCustomerAddresses 
} from '@/lib/hooks'

function CustomerDetail({ customerId }) {
  // Notes
  const { notes, addNote, updateNote, deleteNote } = useCustomerNotes(customerId)

  // Reminders
  const { reminders, addReminder, completeReminder } = useCustomerReminders(customerId)

  // Phones
  const { phones, addPhone, updatePhone, deletePhone } = useCustomerPhones(customerId)

  // Addresses
  const { addresses, addAddress, updateAddress, deleteAddress } = useCustomerAddresses(customerId)

  // Example usage
  const handleAddNote = async () => {
    const result = await addNote("New note content")
    if (result.success) {
      console.log("Note added:", result.note)
    }
  }

  return (
    <div>
      {/* Render customer details */}
    </div>
  )
}
```

### User Hook (`lib/hooks/use-user.ts`)

```typescript
import { useUser } from '@/lib/hooks'

function UserProfile() {
  const { user, isLoading, error } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>Welcome, {user?.displayName}</h1>
      <p>Email: {user?.email}</p>
    </div>
  )
}
```

## Utility Functions (`lib/utils/api-utils.ts`)

### Error Handling

```typescript
import { handleAPIError, handleAPISuccess } from '@/lib/utils/api-utils'

// Handle API errors with toast notifications
try {
  await customerAPI.create(customerData)
  handleAPISuccess("Customer created successfully!")
} catch (error) {
  handleAPIError(error, "Failed to create customer")
}
```

### Validation

```typescript
import { isValidEmail, isValidPhoneNumber } from '@/lib/utils/api-utils'

// Validate email
if (!isValidEmail(email)) {
  throw new Error("Invalid email address")
}

// Validate phone number
if (!isValidPhoneNumber(phone)) {
  throw new Error("Invalid phone number")
}
```

### Formatting

```typescript
import { 
  formatPhoneNumber, 
  formatDate, 
  formatDateTime, 
  getRelativeTime,
  getInitials 
} from '@/lib/utils/api-utils'

// Format phone number
const formatted = formatPhoneNumber("5551234567") // "(555) 123-4567"

// Format dates
const date = formatDate("2024-01-15") // "Jan 15, 2024"
const datetime = formatDateTime("2024-01-15T10:30:00Z") // "Jan 15, 2024, 10:30 AM"

// Relative time
const relative = getRelativeTime("2024-01-15T10:30:00Z") // "2 hours ago"

// Get initials
const initials = getInitials("John", "Doe") // "JD"
```

## Authentication

The API client automatically handles authentication using Firebase custom tokens:

```typescript
import { authenticatedFetch } from '@/lib/auth'

// All API calls automatically include the Firebase ID token
const response = await authenticatedFetch('/customers')
```

## Error Handling

All API functions throw `APIError` instances with detailed error information:

```typescript
import { APIError } from '@/lib/api'

try {
  await customerAPI.create(customerData)
} catch (error) {
  if (error instanceof APIError) {
    console.log("Status:", error.status)
    console.log("Message:", error.message)
    console.log("Details:", error.errors)
  }
}
```

## Environment Variables

Set the following environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3031
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

## Best Practices

1. **Use hooks for data fetching**: Prefer React hooks over direct API calls for better caching and state management
2. **Handle loading states**: Always check `isLoading` before rendering data
3. **Error boundaries**: Wrap components in error boundaries to catch API errors
4. **Optimistic updates**: Use SWR's `mutate` function for optimistic UI updates
5. **Validation**: Always validate data before sending to the API
6. **Toast notifications**: Use the utility functions for consistent error/success messaging

## Example Components

See `components/customer-form.tsx` for a complete example of how to use the API functions in a React component. 