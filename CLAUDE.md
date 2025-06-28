# CLAUDE.md - Customer Service Web Application

## Project Overview

This is a **Customer Management System** built with Next.js 15 (App Router), TypeScript, and Firebase Authentication. The application provides comprehensive customer relationship management for businesses like dental offices, car mechanics, and hair salons.

**Tech Stack:**
- **Frontend:** Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Authentication:** Firebase Authentication
- **State Management:** SWR for data fetching and caching
- **Backend:** RESTful API (Node.js, KoaJS, PostgreSQL) - see `backend-context.md`
- **Styling:** Tailwind CSS with custom design system
- **Icons:** Tabler Icons, Lucide React

## Architecture Overview

### 1. Application Structure

```
customers-service-web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── customers/         # Customer management
│   ├── dashboard/         # Main dashboard
│   ├── reminders/         # Reminder management
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utility libraries
│   ├── api.ts           # API client functions
│   ├── auth.ts          # Authentication utilities
│   ├── firebase.ts      # Firebase configuration
│   └── hooks/           # Custom React hooks
└── middleware.ts         # Next.js middleware
```

### 2. Authentication Flow

**Firebase Authentication Integration:**
- Uses Firebase Client SDK for authentication
- Backend expects Firebase ID tokens in `Authorization: Bearer <token>` header
- Custom signup flow: Frontend → Backend `/auth/signup` → Firebase Custom Token → ID Token
- Login flow: Direct Firebase `signInWithEmailAndPassword` → ID Token

**Key Files:**
- `lib/auth.ts` - Authentication utilities
- `components/auth-provider.tsx` - Auth context provider
- `components/layout/protected-layout.tsx` - Route protection
- `middleware.ts` - Server-side route protection

### 3. Data Management

**SWR Integration:**
- All API calls use SWR for caching, revalidation, and optimistic updates
- Custom hooks in `lib/hooks/` for each data type
- Automatic background revalidation and error handling

**API Client:**
- `lib/api.ts` - Centralized API client with TypeScript interfaces
- `authenticatedFetch()` - Automatic token injection
- Error handling with custom `APIError` class

**Key Data Hooks:**
- `useCustomers()` - Customer list and search
- `useCustomer(id)` - Single customer details
- `useCustomerNotes(id)` - Customer notes management
- `useCustomerReminders(id)` - Customer reminders
- `useAllReminders()` - Global reminder management

### 4. UI/UX Standards

**Modern Design Philosophy:**
- **Linear.app inspired design** - Clean, minimal, and professional interface
- **shadcn/ui components** for consistency and accessibility
- **Tailwind CSS** for utility-first styling
- **Mobile-first responsive design** with smooth transitions
- **Dark/light theme support** with proper contrast ratios
- **Modern typography** with proper hierarchy and spacing

**Data Presentation:**
- **Clear and understandable data visualization** - Present backend API data in intuitive ways
- **Consistent card layouts** for different data types
- **Proper loading states** with skeleton components
- **Empty states** with helpful messaging
- **Data tables** with sorting, filtering, and pagination
- **Charts and graphs** for analytics and insights
- **Status indicators** with appropriate colors and icons

**Navigation and Interaction:**
- **Next.js Link components** instead of `<a>` tags for better performance and client-side navigation
- **Breadcrumb navigation** for deep page hierarchies
- **Search functionality** with real-time results
- **Modal dialogs** for focused interactions
- **Toast notifications** for user feedback
- **Keyboard navigation** support
- **Smooth page transitions** and micro-interactions

**Component Patterns:**
- All forms use shadcn/ui components with proper validation
- Consistent loading states with `<Loading />` component
- Error handling with toast notifications (Sonner)
- Modal dialogs for forms and confirmations
- Responsive grid layouts for data presentation

## How Claude Should Work With This Codebase

### 1. Authentication Guidelines

**Always assume authentication is required:**
- All API endpoints require Firebase ID tokens
- Use `authenticatedFetch()` from `lib/auth.ts` for API calls
- Check authentication state with `useAuth()` hook
- Protect routes with `<ProtectedLayout>` component

**Example authentication pattern:**
```typescript
import { useAuth } from '@/components/auth-provider';
import { authenticatedFetch } from '@/lib/auth';

// In components
const { user, loading } = useAuth();
if (loading) return <Loading />;
if (!user) return <Redirect to="/login" />;

// For API calls
const response = await authenticatedFetch('/api/endpoint');
```

### 2. Component Development

**Follow shadcn/ui patterns:**
- Use existing shadcn/ui components from `components/ui/`
- Maintain consistent spacing and typography
- Implement proper loading and error states
- Use TypeScript interfaces for all props

**Component structure:**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';

interface ComponentProps {
  // Define props with TypeScript
}

export function ComponentName({ ...props }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  
  if (loading) return <Loading />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

### 3. Data Fetching Patterns

**Use existing hooks when possible:**
- Leverage existing SWR hooks in `lib/hooks/`
- Follow the established patterns for mutations
- Handle errors consistently with `handleAPIError()`

**Creating new data hooks:**
```typescript
import useSWR, { mutate } from 'swr';
import { customerAPI } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

export function useCustomData() {
  const { user, loading: authLoading } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? 'custom-key' : null,
    () => customerAPI.someEndpoint(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: data || [],
    isLoading: authLoading || isLoading,
    error,
    mutate,
  };
}
```

### 4. API Integration

**Backend API Reference:**
- **Base URL:** `http://localhost:3001` (development)
- **Authentication:** Firebase ID tokens in `Authorization` header
- **Endpoints:** See `backend-context.md` for complete API documentation

**API Client Usage:**
```typescript
import { customerAPI } from '@/lib/api';

// Create customer
const newCustomer = await customerAPI.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
});

// Get customers
const customers = await customerAPI.getAll();

// Handle errors
try {
  await customerAPI.create(data);
} catch (error) {
  handleAPIError(error, 'Failed to create customer');
}
```

### 5. Routing and Navigation

**App Router Structure:**
- Use Next.js 15 App Router patterns
- Implement proper loading and error boundaries
- Use `useRouter()` for programmatic navigation

**Navigation Best Practices:**
- **Always use Next.js Link components** instead of `<a>` tags for internal navigation
- Use `Link` from `next/link` for better performance and client-side routing
- Implement proper loading states during navigation
- Use breadcrumbs for deep page hierarchies

**Protected Routes:**
```typescript
import { ProtectedLayout } from '@/components/layout/protected-layout';
import Link from 'next/link';

export default function ProtectedPage() {
  return (
    <ProtectedLayout>
      {/* Use Link for navigation */}
      <Link href="/customers" className="text-blue-600 hover:text-blue-800">
        View Customers
      </Link>
      {/* Page content */}
    </ProtectedLayout>
  );
}
```

### 6. Error Handling

**Consistent Error Patterns:**
- Use `handleAPIError()` utility for API errors
- Implement proper loading states
- Show user-friendly error messages
- Log errors for debugging

**Error handling example:**
```typescript
import { handleAPIError } from '@/lib/utils/api-utils';
import { toast } from 'sonner';

try {
  await someAPI();
  toast.success('Operation completed');
} catch (error) {
  handleAPIError(error, 'Operation failed');
}
```

### 7. Styling Guidelines

**Tailwind CSS Usage:**
- Use utility classes for styling
- Follow mobile-first responsive design
- Use CSS variables for theming
- Maintain consistent spacing with Tailwind's spacing scale

**Modern UI Patterns:**
- Use subtle shadows and borders for depth
- Implement smooth transitions and hover effects
- Use appropriate color schemes for different states
- Maintain proper contrast ratios for accessibility

**Component styling:**
```typescript
// Good - Modern, clean design
<div className="flex flex-col gap-4 p-6 bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <h2 className="text-xl font-semibold text-foreground">Title</h2>
  <p className="text-sm text-muted-foreground">Description</p>
</div>

// Avoid custom CSS unless necessary
```

### 8. State Management

**SWR for Server State:**
- Use SWR for all API data
- Implement optimistic updates for better UX
- Use `mutate()` for cache invalidation

**Local State:**
- Use React `useState` for component state
- Use `useEffect` for side effects
- Keep state as local as possible

### 9. Performance Considerations

**Optimization Patterns:**
- Use `useMemo` and `useCallback` for expensive operations
- Implement proper loading states
- Use SWR's built-in caching and deduplication
- Optimize bundle size with dynamic imports when needed
- Use Next.js Image component for optimized images

### 10. Testing and Development

**Development Workflow:**
- Use `npm run dev` for development
- Check TypeScript errors with `npm run lint`
- Test authentication flows thoroughly
- Verify API integration with backend

**Common Development Tasks:**
1. **Adding new features:** Create components in `components/`, hooks in `lib/hooks/`
2. **API integration:** Use existing patterns in `lib/api.ts`
3. **Authentication:** Follow established Firebase patterns
4. **Styling:** Use shadcn/ui components and Tailwind utilities
5. **Navigation:** Use Next.js Link components for all internal links

## Key Files Reference

### Core Configuration
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

### Authentication
- `lib/firebase.ts` - Firebase configuration
- `lib/auth.ts` - Authentication utilities
- `components/auth-provider.tsx` - Auth context
- `middleware.ts` - Route protection

### API and Data
- `lib/api.ts` - API client and types
- `lib/hooks/` - Custom data hooks
- `lib/utils/api-utils.ts` - Error handling utilities

### UI Components
- `components/ui/` - shadcn/ui components
- `components/layout/` - Layout components
- `app/globals.css` - Global styles

### Pages
- `app/page.tsx` - Landing page
- `app/dashboard/page.tsx` - Main dashboard
- `app/customers/page.tsx` - Customer list
- `app/customers/[id]/page.tsx` - Customer details

## Backend Integration

**Important:** Always refer to `backend-context.md` for:
- Complete API endpoint documentation
- Request/response formats
- Authentication requirements
- Error handling patterns

The backend is a separate Node.js/KoaJS application that provides the RESTful API for this frontend application. 