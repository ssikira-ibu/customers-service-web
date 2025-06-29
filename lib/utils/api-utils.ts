import { toast } from 'sonner';
import { APIError } from '../api';
import PostalAddress from "i18n-postal-address";

// Handle API errors with toast notifications
export function handleAPIError(
  error: unknown,
  defaultMessage = "An error occurred"
) {
  if (error instanceof APIError) {
    // Show specific error message from API
    toast.error(error.message);
    return error;
  } else if (error instanceof Error) {
    // Show generic error message
    toast.error(error.message || defaultMessage);
    return error;
  } else {
    // Show default error message
    toast.error(defaultMessage);
    return new Error(defaultMessage);
  }
}

// Handle API success with toast notifications
export function handleAPISuccess(message: string) {
  toast.success(message);
}

// Handle API loading states
export function showLoadingToast(message: string) {
  return toast.loading(message);
}

// Dismiss loading toast
export function dismissLoadingToast(toastId: string) {
  toast.dismiss(toastId);
}

// Format API error messages for display
export function formatErrorMessage(error: APIError): string {
  if (error.errors && error.errors.length > 0) {
    return error.errors.map((err: any) => err.message || err).join(", ");
  }
  return error.message;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced phone number utilities using libphonenumber-js
import {
  parsePhoneNumber,
  isValidPhoneNumber as isValidLibPhoneNumber,
  formatIncompletePhoneNumber,
  AsYouType,
} from "libphonenumber-js";

// Validate phone number format (enhanced with international support)
export function isValidPhoneNumber(phone: string, country?: string): boolean {
  if (!phone || typeof phone !== "string") return false;

  try {
    // Try to parse the phone number
    const phoneNumber = parsePhoneNumber(phone, country as any);
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch (error) {
    // Fallback to libphonenumber-js validation
    return isValidLibPhoneNumber(phone, country as any);
  }
}

// Format phone number for display (international support)
export function formatPhoneNumber(
  phone: string,
  format: "national" | "international" | "e164" | "uri" = "national"
): string {
  if (!phone) return "";

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (phoneNumber && phoneNumber.isValid()) {
      switch (format) {
        case "international":
          return phoneNumber.formatInternational();
        case "national":
          return phoneNumber.formatNational();
        case "e164":
          return phoneNumber.format("E.164");
        case "uri":
          return phoneNumber.getURI();
        default:
          return phoneNumber.formatNational();
      }
    }
  } catch (error) {
    // If parsing fails, return the original phone or try basic formatting
    console.warn("Phone number formatting failed:", error);
  }

  // Fallback: format incomplete phone number as user types
  return formatIncompletePhoneNumber(phone) || phone;
}

// Get phone number details (country, type, etc.)
export function getPhoneNumberInfo(phone: string) {
  if (!phone) return null;

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (phoneNumber && phoneNumber.isValid()) {
      return {
        country: phoneNumber.country,
        countryCode: phoneNumber.countryCallingCode,
        nationalNumber: phoneNumber.nationalNumber,
        type: phoneNumber.getType(), // 'MOBILE', 'FIXED_LINE', etc.
        isPossible: phoneNumber.isPossible(),
        isValid: phoneNumber.isValid(),
        formatted: {
          international: phoneNumber.formatInternational(),
          national: phoneNumber.formatNational(),
          e164: phoneNumber.format("E.164"),
          uri: phoneNumber.getURI(),
        },
      };
    }
  } catch (error) {
    console.warn("Failed to get phone number info:", error);
  }

  return null;
}

// Format phone number as user types (for input fields)
export function formatPhoneNumberAsYouType(
  phone: string,
  country?: string
): string {
  if (!phone) return "";

  try {
    const asYouType = new AsYouType(country as any);
    return asYouType.input(phone);
  } catch (error) {
    // If formatting fails, return the cleaned input
    return phone.replace(/[^\d\s\-\(\)]/g, "");
  }
}

// Format phone number for national display (without country code)
export function formatPhoneNumberNational(
  phone: string,
  country?: string
): string {
  if (!phone) return "";

  try {
    // If the phone already has country code, parse it fully
    let phoneNumber = parsePhoneNumber(phone, country as any);

    // If parsing failed and we have a country, try with country prefix
    if (!phoneNumber && country) {
      const countryCodes: Record<string, string> = {
        US: "1",
        CA: "1",
        GB: "44",
        AU: "61",
        DE: "49",
        FR: "33",
        JP: "81",
        CN: "86",
        IN: "91",
        BR: "55",
        MX: "52",
        ES: "34",
        IT: "39",
        NL: "31",
      };
      const countryCode = countryCodes[country];
      if (countryCode) {
        phoneNumber = parsePhoneNumber(
          `+${countryCode}${phone}`,
          country as any
        );
      }
    }

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatNational();
    }

    // Fallback to AsYouType formatting
    const asYouType = new AsYouType(country as any);
    const formatted = asYouType.input(phone);

    // Remove country code if it appears in the formatted result
    if (country && formatted) {
      const countryCodes: Record<string, string> = {
        US: "+1",
        CA: "+1",
        GB: "+44",
        AU: "+61",
        DE: "+49",
        FR: "+33",
        JP: "+81",
        CN: "+86",
        IN: "+91",
        BR: "+55",
        MX: "+52",
        ES: "+34",
        IT: "+39",
        NL: "+31",
      };
      const countryPrefix = countryCodes[country];
      if (countryPrefix && formatted.startsWith(countryPrefix)) {
        return formatted.replace(countryPrefix, "").trim();
      }
    }

    return formatted;
  } catch (error) {
    return phone.replace(/[^\d\s\-\(\)]/g, "");
  }
}

// Get cleaner phone validation with detailed info
export function validatePhoneNumber(
  phone: string,
  country?: string
): {
  isValid: boolean;
  isPossible: boolean;
  type?: string;
  nationalNumber?: string;
  internationalNumber?: string;
} {
  if (!phone) return { isValid: false, isPossible: false };

  try {
    const phoneNumber = parsePhoneNumber(phone, country as any);

    if (phoneNumber) {
      return {
        isValid: phoneNumber.isValid(),
        isPossible: phoneNumber.isPossible(),
        type: phoneNumber.getType(),
        nationalNumber: phoneNumber.formatNational(),
        internationalNumber: phoneNumber.formatInternational(),
      };
    }
  } catch (error) {
    // Silent fallback
  }

  return { isValid: false, isPossible: false };
}

// Check if phone number is mobile
export function isMobilePhoneNumber(phone: string): boolean {
  const info = getPhoneNumberInfo(phone);
  return info?.type === "MOBILE" || info?.type === "FIXED_LINE_OR_MOBILE";
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date and time for display
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate initials from name
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}

// Capitalize first letter
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Get priority color for reminders
export function getPriorityColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "low":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    case "medium":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
    case "high":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
  }
}

// Get phone number validation confidence score
export function getPhoneConfidenceScore(
  phone: string,
  country?: string
): {
  score: number; // 0-100
  level: "high" | "medium" | "low";
  issues: string[];
} {
  if (!phone)
    return { score: 0, level: "low", issues: ["Phone number is required"] };

  const issues: string[] = [];
  let score = 100;

  try {
    const phoneNumber = parsePhoneNumber(phone, country as any);

    if (!phoneNumber) {
      return {
        score: 0,
        level: "low",
        issues: ["Invalid phone number format"],
      };
    }

    // Check if valid
    if (!phoneNumber.isValid()) {
      score -= 50;
      issues.push("Phone number format may be incorrect");
    }

    // Check if possible (less strict than valid)
    if (!phoneNumber.isPossible()) {
      score -= 30;
      issues.push("Phone number length seems unusual");
    }

    // Check phone number type
    const type = phoneNumber.getType();
    if (!type) {
      score -= 10;
      issues.push("Unable to determine phone type");
    }

    // Prefer mobile numbers for better reachability
    if (type && !["MOBILE", "FIXED_LINE_OR_MOBILE"].includes(type)) {
      score -= 5;
      issues.push("Non-mobile numbers may have lower reachability");
    }

    // Check country consistency
    if (country && phoneNumber.country !== country) {
      score -= 15;
      issues.push(
        `Phone number appears to be from ${phoneNumber.country}, not ${country}`
      );
    }

    // Determine level
    let level: "high" | "medium" | "low" = "high";
    if (score < 70) level = "medium";
    if (score < 40) level = "low";

    return { score: Math.max(0, score), level, issues };
  } catch (error) {
    return { score: 0, level: "low", issues: ["Unable to parse phone number"] };
  }
}

/**
 * Format an address object for display using i18n-postal-address library
 * @param address The address object to format
 * @returns A formatted address string with proper line breaks
 */
export function formatAddressForDisplay(address: {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  region?: string;
  district?: string;
  postalCode?: string;
  country: string;
  type?: string;
}): string {
  try {
    const postalAddress = new PostalAddress();

    // Set address components using the library's methods
    if (address.addressLine1) {
      postalAddress.setAddress1(address.addressLine1);
    }

    if (address.addressLine2) {
      postalAddress.setAddress2(address.addressLine2);
    }

    if (address.city) {
      postalAddress.setCity(address.city);
    }

    if (address.stateProvince) {
      postalAddress.setState(address.stateProvince);
    } else if (address.region) {
      postalAddress.setRegion(address.region);
    }

    if (address.district) {
      postalAddress.setProvince(address.district);
    }

    if (address.postalCode) {
      postalAddress.setPostalCode(address.postalCode);
    }

    if (address.country) {
      postalAddress.setCountry(address.country);
    }

    // Set format based on country
    const countryCode = getCountryCode(address.country);
    if (countryCode) {
      postalAddress.setFormat({
        country: countryCode,
        type: "personal", // Use personal format for customer addresses
        useTransforms: true, // Enable abbreviations and transformations
      });
    }

    return postalAddress.toString();
  } catch (error) {
    console.warn("Error formatting address with i18n-postal-address:", error);
    // Fallback to simple formatting
    return formatAddressSimple(address);
  }
}

/**
 * Simple fallback address formatting if library fails
 */
function formatAddressSimple(address: {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  region?: string;
  postalCode?: string;
  country: string;
}): string {
  const lines: string[] = [];

  if (address.addressLine1) lines.push(address.addressLine1);
  if (address.addressLine2) lines.push(address.addressLine2);

  let cityLine = address.city;
  if (address.stateProvince) {
    cityLine += `, ${address.stateProvince}`;
  } else if (address.region) {
    cityLine += `, ${address.region}`;
  }
  if (address.postalCode) {
    cityLine += ` ${address.postalCode}`;
  }
  lines.push(cityLine);

  if (address.country) {
    lines.push(address.country);
  }

  return lines.join("\n");
}

/**
 * Get ISO country code from country name
 * @param countryName Full country name
 * @returns ISO 3166-1 alpha-2 country code
 */
function getCountryCode(countryName: string): string | null {
  const countryMap: Record<string, string> = {
    "United States": "US",
    "United States of America": "US",
    USA: "US",
    Canada: "CA",
    "United Kingdom": "GB",
    UK: "GB",
    "Great Britain": "GB",
    Germany: "DE",
    France: "FR",
    Spain: "ES",
    Italy: "IT",
    Netherlands: "NL",
    Belgium: "BE",
    Austria: "AT",
    Switzerland: "CH",
    Australia: "AU",
    "New Zealand": "NZ",
    Japan: "JP",
    "South Korea": "KR",
    China: "CN",
    India: "IN",
    Brazil: "BR",
    Mexico: "MX",
    Argentina: "AR",
    Poland: "PL",
    "Czech Republic": "CZ",
    Slovakia: "SK",
    Hungary: "HU",
    Romania: "RO",
    Bulgaria: "BG",
    Croatia: "HR",
    Slovenia: "SI",
    Serbia: "RS",
    "Bosnia and Herzegovina": "BA",
    Montenegro: "ME",
    "North Macedonia": "MK",
    Albania: "AL",
    Greece: "GR",
    Turkey: "TR",
    Cyprus: "CY",
    Malta: "MT",
    Portugal: "PT",
    Ireland: "IE",
    Iceland: "IS",
    Norway: "NO",
    Sweden: "SE",
    Finland: "FI",
    Denmark: "DK",
    Estonia: "EE",
    Latvia: "LV",
    Lithuania: "LT",
    Luxembourg: "LU",
    Liechtenstein: "LI",
    Monaco: "MC",
    "San Marino": "SM",
    "Vatican City": "VA",
    Andorra: "AD",
  };

  return countryMap[countryName] || null;
}

/**
 * Create a formatted address using i18n-postal-address with custom settings
 * @param address The address object
 * @param options Formatting options
 * @returns PostalAddress instance for further customization
 */
export function createFormattedAddress(
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    region?: string;
    district?: string;
    postalCode?: string;
    country: string;
  },
  options: {
    type?: "personal" | "business" | "default";
    useTransforms?: boolean;
    includeCountry?: boolean;
  } = {}
): PostalAddress {
  const postalAddress = new PostalAddress();

  // Set all address components
  if (address.addressLine1) postalAddress.setAddress1(address.addressLine1);
  if (address.addressLine2) postalAddress.setAddress2(address.addressLine2);
  if (address.city) postalAddress.setCity(address.city);
  if (address.stateProvince) postalAddress.setState(address.stateProvince);
  if (address.region && !address.stateProvince)
    postalAddress.setRegion(address.region);
  if (address.district) postalAddress.setProvince(address.district);
  if (address.postalCode) postalAddress.setPostalCode(address.postalCode);
  if (address.country) postalAddress.setCountry(address.country);

  // Apply formatting options
  const countryCode = getCountryCode(address.country);
  if (countryCode) {
    postalAddress.setFormat({
      country: countryCode,
      type: options.type || "personal",
      useTransforms: options.useTransforms !== false,
    });
  }

  return postalAddress;
}

/**
 * Get address type emoji for display
 * @param type The address type
 * @returns Emoji representing the address type
 */
export function getAddressTypeEmoji(type?: string): string {
  switch (type?.toLowerCase()) {
    case "home":
      return "🏠";
    case "work":
    case "business":
      return "💼";
    case "billing":
      return "💳";
    case "shipping":
      return "📦";
    default:
      return "📍";
  }
}

/**
 * Format address for Google Maps URL
 * @param address The address object
 * @returns A URL-encoded string suitable for Google Maps
 */
export function formatAddressForMaps(address: {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  region?: string;
  postalCode?: string;
  country: string;
}): string {
  const parts: string[] = [];

  if (address.addressLine1) parts.push(address.addressLine1);
  if (address.addressLine2) parts.push(address.addressLine2);
  parts.push(address.city);
  if (address.stateProvince) parts.push(address.stateProvince);
  if (address.region && !address.stateProvince) parts.push(address.region);
  if (address.postalCode) parts.push(address.postalCode);
  parts.push(address.country);

  return encodeURIComponent(parts.join(", "));
}

/**
 * Validate address completeness
 * @param address The address object to validate
 * @returns Object with validation results
 */
export function validateAddress(address: {
  addressLine1?: string;
  city?: string;
  country?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!address.addressLine1?.trim()) {
    errors.push("Street address is required");
  }

  if (!address.city?.trim()) {
    errors.push("City is required");
  }

  if (!address.country?.trim()) {
    errors.push("Country is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
} 