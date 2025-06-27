import { 
  signInWithEmailAndPassword, 
  signInWithCustomToken, 
  getIdToken,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Sign in with email and password using Firebase Auth
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError.message
    };
  }
}

/**
 * Sign up by calling the backend /auth/signup endpoint and using the returned custom token
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // Call backend signup endpoint
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Signup failed'
      };
    }

    const { token } = await response.json();

    // Use the custom token to sign in with Firebase
    const userCredential = await signInWithCustomToken(auth, token);
    
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed'
    };
  }
}

/**
 * Get the current user's ID token
 */
export async function getIdTokenForUser(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await getIdToken(user);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Create a fetch wrapper that automatically includes the Authorization header
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdTokenForUser();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
} 