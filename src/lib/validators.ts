/**
 * Advanced Validators and Utilities
 * Input validation, data formatting, and error handling
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================
// VALIDATION SCHEMAS
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================
// EMAIL VALIDATION
// ============================================

export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!email) {
    errors.push({
      field: "email",
      message: "Email is required",
      code: "REQUIRED",
    });
  } else if (email.length > 100) {
    errors.push({
      field: "email",
      message: "Email must be less than 100 characters",
      code: "MAX_LENGTH",
    });
  } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
      code: "INVALID_FORMAT",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// PHONE VALIDATION
// ============================================

export function validatePhone(phone: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!phone) {
    return {
      valid: true,
      errors: [],
    }; // Phone is optional
  }

  if (phone.length < 7 || phone.length > 20) {
    errors.push({
      field: "phone",
      message: "Phone must be between 7 and 20 characters",
      code: "INVALID_LENGTH",
    });
  }

  if (!/^[\d\s+\-()]+$/.test(phone)) {
    errors.push({
      field: "phone",
      message: "Phone contains invalid characters",
      code: "INVALID_FORMAT",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// DATE VALIDATION
// ============================================

export function validateDate(date: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!date) {
    errors.push({
      field: "date",
      message: "Date is required",
      code: "REQUIRED",
    });
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        field: "date",
        message: "Invalid date format",
        code: "INVALID_FORMAT",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const startValidation = validateDate(startDate);
  const endValidation = validateDate(endDate);

  if (!startValidation.valid) {
    errors.push(...startValidation.errors);
  }

  if (!endValidation.valid) {
    errors.push(...endValidation.errors);
  }

  if (startValidation.valid && endValidation.valid) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      errors.push({
        field: "dateRange",
        message: "Start date must be before end date",
        code: "INVALID_RANGE",
      });
    }

    // Check for future dates if needed
    if (start < new Date()) {
      errors.push({
        field: "startDate",
        message: "Start date must be in the future",
        code: "PAST_DATE",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// NUMERIC VALIDATION
// ============================================

export function validateAmount(amount: any): ValidationResult {
  const errors: ValidationError[] = [];

  const num = parseFloat(amount);

  if (isNaN(num)) {
    errors.push({
      field: "amount",
      message: "Amount must be a valid number",
      code: "INVALID_TYPE",
    });
  } else if (num <= 0) {
    errors.push({
      field: "amount",
      message: "Amount must be greater than 0",
      code: "MIN_VALUE",
    });
  } else if (num > 999999999) {
    errors.push({
      field: "amount",
      message: "Amount is too large",
      code: "MAX_VALUE",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate positive integer
 */
export function validatePositiveInteger(value: any): ValidationResult {
  const errors: ValidationError[] = [];

  const num = parseInt(value);

  if (isNaN(num)) {
    errors.push({
      field: "value",
      message: "Value must be a valid integer",
      code: "INVALID_TYPE",
    });
  } else if (num <= 0) {
    errors.push({
      field: "value",
      message: "Value must be greater than 0",
      code: "MIN_VALUE",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// STRING VALIDATION
// ============================================

export function validateString(
  value: string,
  minLength: number = 1,
  maxLength: number = 255
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value) {
    errors.push({
      field: "value",
      message: "Value is required",
      code: "REQUIRED",
    });
  } else if (value.length < minLength) {
    errors.push({
      field: "value",
      message: `Value must be at least ${minLength} characters`,
      code: "MIN_LENGTH",
    });
  } else if (value.length > maxLength) {
    errors.push({
      field: "value",
      message: `Value must be at most ${maxLength} characters`,
      code: "MAX_LENGTH",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// REQUEST VALIDATION
// ============================================

/**
 * Extract and validate request body
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  requiredFields: string[]
): Promise<{ data: T | null; errors: ValidationError[] }> {
  const errors: ValidationError[] = [];

  try {
    const body = await req.json();

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in body)) {
        errors.push({
          field,
          message: `${field} is required`,
          code: "REQUIRED",
        });
      }
    }

    if (errors.length > 0) {
      return { data: null, errors };
    }

    return { data: body as T, errors: [] };
  } catch (error) {
    errors.push({
      field: "body",
      message: "Invalid JSON",
      code: "INVALID_JSON",
    });
    return { data: null, errors };
  }
}

/**
 * Extract query parameters
 */
export function extractQueryParams(
  req: NextRequest,
  paramNames: string[]
): Record<string, string | null> {
  const params: Record<string, string | null> = {};
  const url = new URL(req.url);

  for (const name of paramNames) {
    params[name] = url.searchParams.get(name);
  }

  return params;
}

// ============================================
// RESPONSE FORMATTING
// ============================================

/**
 * Success response
 */
export function successResponse<T>(data: T, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Error response
 */
export function errorResponse(
  message: string,
  errors: ValidationError[] = [],
  statusCode: number = 400
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  statusCode: number = 200
) {
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// ============================================
// DATA FORMATTING
// ============================================

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = "RWF"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date | string, format: string = "en-US"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(format, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time
 */
export function formatTime(date: Date | string, format: string = "en-US"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString(format, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format datetime
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// ============================================
// SANITIZATION
// ============================================

/**
 * Sanitize string for SQL/XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[&<>"']/g, (char) => {
      const escapeMap: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return escapeMap[char] || char;
    })
    .trim();
}

/**
 * Sanitize object
 */
export function sanitizeObject<T>(obj: Record<string, any>): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((v) =>
        typeof v === "string" ? sanitizeString(v) : v
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// ============================================
// SLUG GENERATION
// ============================================

/**
 * Generate URL slug from string
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate short ID
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${random}`;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${date}-${random}`;
}

/**
 * Generate transaction ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}
