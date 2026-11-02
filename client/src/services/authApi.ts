import { UserRole } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AvatarOption {
  id: string;
  label: string;
  url: string;
}

export const DEFAULT_CARTOON_AVATARS: AvatarOption[] = [
  { id: 'boba-bear', label: 'Boba Bear', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'happy-sprout', label: 'Happy Sprout', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'matcha-bob', label: 'Matcha Bob', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'sunny-chef', label: 'Sunny Chef', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'cookie-champ', label: 'Cookie Champ', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'choco-panda', label: 'Choco Panda', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'mango-twist', label: 'Mango Twist', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'taco-rex', label: 'Taco Rex', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sammy&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'pizza-pip', label: 'Pizza Pip', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'waffle-wiz', label: 'Waffle Wiz', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ruby&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'berry-fox', label: 'Berry Fox', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jasper&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'avocado-ace', label: 'Avocado Ace', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Finn&backgroundColor=b6e3f4,c0aede,d1d4f9' },
];

export function getDefaultAvatar(seed?: string): string {
  if (!seed) return DEFAULT_CARTOON_AVATARS[0].url;
  const index = Math.abs(
    seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % DEFAULT_CARTOON_AVATARS.length;
  return DEFAULT_CARTOON_AVATARS[index].url;
}

export interface PartnerRestaurantInfo {
  id: string;
  ownerUserId: string;
  name: string;
  branchName: string;
  address: string;
  city: string;
  phone?: string;
  hygieneGrade: string;
  licenseNumber: string;
  licenseDocumentUrl?: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'RE_INSPECT' | 'REJECTED';
  isStoreLive: boolean;
  rating: number;
  reviewCount: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    restaurant?: PartnerRestaurantInfo;
    token: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Safely wraps fetch to provide clear connection failure error messages
 */
async function fetchSafe(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err) {
    // If absolute URL fails (e.g. cross-origin/IPv6 refusal), retry with relative URL through Vite proxy
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const relativeUrl = url.replace(/^https?:\/\/[^/]+/, '');
        return await fetch(relativeUrl, options);
      } catch {}
    }
    throw new Error('Unable to connect to SaveBite server. Please ensure the backend server is running and check your network connection.');
  }
}

/**
 * Safely parse HTTP response and extract JSON or descriptive error message.
 * Prevents "Unexpected end of JSON input" errors when responses are empty, HTML, or malformed.
 */
async function parseJsonResponse<T = any>(res: Response, fallbackMessage: string): Promise<T> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    throw new Error('Failed to read response from server.');
  }

  let json: any = null;
  if (text && text.trim().length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      // Body is not valid JSON (e.g., HTML 404/500 page or proxy error)
    }
  }

  if (!res.ok) {
    // If structured JSON error with a message is returned:
    if (json && typeof json.message === 'string' && json.message.trim().length > 0) {
      throw new Error(json.message);
    }

    // If plain text error (not HTML) is returned:
    if (text && text.trim().length > 0 && !text.trim().startsWith('<') && text.length < 200) {
      throw new Error(text.trim());
    }

    // Meaningful HTTP status fallbacks:
    if (res.status === 409) {
      throw new Error('An account with this email already exists.');
    }
    if (res.status === 400) {
      throw new Error('Invalid request data. Please check your input.');
    }
    if (res.status === 401) {
      throw new Error('Invalid email or password.');
    }
    if (res.status === 403) {
      throw new Error('Access denied. Insufficient permissions.');
    }
    if (res.status === 404) {
      throw new Error('Service endpoint not found.');
    }
    if (res.status >= 500) {
      throw new Error('Server encountered an error. Please try again later.');
    }

    throw new Error(fallbackMessage);
  }

  // Response status was OK (2xx), but verify JSON body
  if (!json) {
    throw new Error('Server returned an empty or invalid response.');
  }

  if (json.success === false) {
    throw new Error(json.message || fallbackMessage);
  }

  return json;
}

export const authApi = {
  /**
   * Customer Login
   */
  async loginCustomer(email: string, password: string): Promise<AuthResponse['data']> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await parseJsonResponse<AuthResponse>(res, 'Login failed.');

    localStorage.setItem('savebite_token', json.data.token);
    localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
    return json.data;
  },

  /**
   * Customer Registration
   */
  async registerCustomer(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse['data']> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await parseJsonResponse<AuthResponse>(res, 'Registration failed.');

    if (!json.data || !json.data.user) {
      throw new Error('Registration completed, but user profile was not returned.');
    }

    localStorage.setItem('savebite_token', json.data.token);
    localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
    return json.data;
  },

  /**
   * Restaurant Owner Login
   */
  async loginPartner(email: string, password: string): Promise<AuthResponse['data']> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/partner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await parseJsonResponse<AuthResponse>(res, 'Restaurant partner login failed.');

    localStorage.setItem('savebite_token', json.data.token);
    localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
    if (json.data.restaurant) {
      localStorage.setItem('savebite_partner_restaurant', JSON.stringify(json.data.restaurant));
    }
    return json.data;
  },

  /**
   * Restaurant Owner Registration & Application
   */
  async registerPartner(formData: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    restaurantName: string;
    branchName?: string;
    address: string;
    city?: string;
    restaurantPhone: string;
    licenseNumber: string;
    hygieneGrade?: string;
    licenseDocumentUrl?: string;
  }): Promise<AuthResponse['data']> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/partner/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const json = await parseJsonResponse<AuthResponse>(res, 'Restaurant application failed.');

    localStorage.setItem('savebite_token', json.data.token);
    localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
    if (json.data.restaurant) {
      localStorage.setItem('savebite_partner_restaurant', JSON.stringify(json.data.restaurant));
    }
    return json.data;
  },

  /**
   * Secure SuperAdmin Login (No registration endpoint)
   */
  async loginAdmin(email: string, password: string): Promise<AuthResponse['data']> {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const res = await fetchSafe(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    const json = await parseJsonResponse<AuthResponse>(res, 'Admin authentication failed.');

    localStorage.setItem('savebite_token', json.data.token);
    localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
    return json.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(): Promise<AuthResponse['data'] | null> {
    const token = localStorage.getItem('savebite_token');
    if (!token) return null;

    try {
      const res = await fetchSafe(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const json = JSON.parse(text);
          if (json.success && json.data) {
            localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
            if (json.data.restaurant) {
              localStorage.setItem('savebite_partner_restaurant', JSON.stringify(json.data.restaurant));
            }
            return { ...json.data, token };
          }
        }
      }
    } catch {
      // Fallback to local storage cached user
    }

    const cachedUser = localStorage.getItem('savebite_user');
    const cachedRest = localStorage.getItem('savebite_partner_restaurant');
    if (cachedUser) {
      return {
        user: JSON.parse(cachedUser),
        restaurant: cachedRest ? JSON.parse(cachedRest) : undefined,
        token,
      };
    }

    return null;
  },

  /**
   * Update authenticated customer's profile avatar
   */
  async updateAvatar(avatarUrl: string): Promise<AuthUser> {
    const user = this.getUser();
    const token = localStorage.getItem('savebite_token');

    // Attempt backend sync if token is available
    if (token) {
      try {
        const res = await fetchSafe(`${API_BASE_URL}/auth/avatar`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl }),
        });

        if (res.ok) {
          const json = await parseJsonResponse<{ success: boolean; data: { user: AuthUser } }>(
            res,
            'Failed to update profile avatar.'
          );
          if (json.data && json.data.user) {
            localStorage.setItem('savebite_user', JSON.stringify(json.data.user));
            return json.data.user;
          }
        }
      } catch (err) {
        console.warn('Backend avatar update skipped/offline:', err);
      }
    }

    // Fallback: If user session exists, update local state
    if (!user) {
      throw new Error('You must be signed in to update your profile avatar.');
    }

    const updatedUser: AuthUser = {
      ...user,
      avatarUrl,
    };
    localStorage.setItem('savebite_user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Log out of current portal session
   */
  logout(): void {
    localStorage.removeItem('savebite_token');
    localStorage.removeItem('savebite_user');
    localStorage.removeItem('savebite_partner_restaurant');
    localStorage.removeItem('savebite_customer_addresses');
  },

  /**
   * Read stored token
   */
  getToken(): string | null {
    return localStorage.getItem('savebite_token');
  },

  /**
   * Read stored user
   */
  getUser(): AuthUser | null {
    const str = localStorage.getItem('savebite_user');
    return str ? JSON.parse(str) : null;
  },

  /**
   * Read stored partner restaurant
   */
  getPartnerRestaurant(): PartnerRestaurantInfo | null {
    const str = localStorage.getItem('savebite_partner_restaurant');
    return str ? JSON.parse(str) : null;
  },

  /**
   * Request a password recovery code (Anti-enumeration guaranteed)
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const json = await parseJsonResponse<{
      success: boolean;
      message: string;
    }>(
      res,
      'If an account is associated with this email address, a verification code has been sent.'
    );

    return {
      message: json.message,
    };
  },

  async verifyPasswordOtp(email: string, otp: string): Promise<string> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/verify-password-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) });
    const json = await parseJsonResponse<{ success: boolean; resetToken: string; message: string }>(res, 'Verification failed.');
    return json.resetToken;
  },

  /**
   * Reset user password using single-use token
   */
  async resetPassword(token: string, newPassword: string): Promise<string> {
    const res = await fetchSafe(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const json = await parseJsonResponse<{ success: boolean; message: string }>(
      res,
      'Password reset failed. Please check your token and try again.'
    );

    return json.message;
  },
};

export default authApi;
