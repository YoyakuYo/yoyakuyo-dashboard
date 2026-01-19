// apps/dashboard/lib/apiClient.ts
// Centralized API client for making authenticated requests to the backend API

import { getSupabaseClient } from './supabaseClient';

/**
 * API base URL - always uses NEXT_PUBLIC_API_URL
 * This is the single source of truth for API URL across the dashboard app
 */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get the API base URL from environment variables
 * @deprecated Use the exported `apiUrl` constant instead
 */
function getApiUrl(): string {
  return apiUrl || '';
}

/**
 * Get the current authenticated user ID
 */
async function getUserId(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Build headers for API requests
 */
async function buildHeaders(customHeaders: Record<string, string> = {}): Promise<HeadersInit> {
  const userId = await getUserId();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Add user ID header if user is authenticated
  if (userId) {
    headers['x-user-id'] = userId;
  }

  return headers;
}

/**
 * Handle API response and parse JSON
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use default error message
      }
    } else {
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // If text parsing fails, use default error message
      }
    }

    throw new Error(errorMessage);
  }

  if (isJson) {
    return await response.json();
  }

  const text = await response.text();
  // Try to parse as JSON even if content-type doesn't say so
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/**
 * API Client class for making authenticated requests
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await buildHeaders(options.headers as Record<string, string>);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
      ...options,
    });

    return handleResponse<T>(response);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    const headers = await buildHeaders(options.headers as Record<string, string>);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    const headers = await buildHeaders(options.headers as Record<string, string>);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    const headers = await buildHeaders(options.headers as Record<string, string>);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await buildHeaders(options.headers as Record<string, string>);
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...options,
    });

    return handleResponse<T>(response);
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export the class for custom instances if needed
export { ApiClient };

// Export helper functions for direct use if needed
export { getApiUrl, getUserId, buildHeaders };

