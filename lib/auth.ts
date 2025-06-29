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
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
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
    console.log("Attempting signup with data:", {
      email: data.email,
      displayName: data.displayName,
    });
    console.log("API URL:", API_BASE_URL);

    // Call backend signup endpoint
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Signup response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Signup failed" }));
      console.error("Signup error:", errorData);
      return {
        success: false,
        error: errorData.error || errorData.message || "Signup failed",
      };
    }

    const responseData = await response.json();
    console.log("Signup response data:", responseData);

    // Backend returns 'customToken', not 'token'
    const { customToken } = responseData;

    if (!customToken) {
      console.error("No customToken in response:", responseData);
      return {
        success: false,
        error: "Invalid response from server",
      };
    }

    // Use the custom token to sign in with Firebase
    if (!auth) {
      throw new Error("Firebase auth not initialized");
    }

    console.log("Signing in with custom token...");
    const userCredential = await signInWithCustomToken(auth, customToken);
    
    console.log("Signup successful!", userCredential.user);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error("Signup error:", error);
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
    if (!auth) {
      return null;
    }
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
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
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
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (!auth) {
    return false;
  }
  return auth.currentUser !== null;
} 