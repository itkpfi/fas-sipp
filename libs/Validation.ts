/**
 * Input Validation Utilities for API Endpoints
 * Provides consistent validation across all API routes
 */

import { NextResponse } from "next/server";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate numeric pagination parameters
 */
export function validatePagination(
  page: string | number = "1",
  limit: string | number = "10",
): { page: number; limit: number } | ValidationError[] {
  const errors: ValidationError[] = [];

  const pageNum = typeof page === "string" ? parseInt(page, 10) : page;
  const limitNum = typeof limit === "string" ? parseInt(limit, 10) : limit;

  if (isNaN(pageNum) || pageNum < 1) {
    errors.push({ field: "page", message: "Page must be a positive number" });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    errors.push({
      field: "limit",
      message: "Limit must be between 1 and 1000",
    });
  }

  if (errors.length > 0) {
    return errors;
  }

  return { page: pageNum, limit: Math.min(limitNum, 1000) };
}

/**
 * Validate age range
 */
export function validateAge(
  age: string | number,
  minAllowed: number = 17,
  maxAllowed: number = 120,
): boolean {
  const ageNum = typeof age === "string" ? parseInt(age, 10) : age;

  if (isNaN(ageNum)) {
    return false;
  }

  return ageNum >= minAllowed && ageNum <= maxAllowed;
}

/**
 * Validate numeric currency value
 */
export function validateCurrency(
  value: string | number,
  min: number = 0,
  max: number = 999999999,
): boolean {
  const num = typeof value === "string" ? parseInt(value, 10) : value;

  if (isNaN(num)) {
    return false;
  }

  return num >= min && num <= max;
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: string | number): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return false;
  }

  return num >= 0 && num <= 100;
}

/**
 * Validate date string (YYYY-MM-DD)
 */
export function validateDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  if (!validateDate(startDate) || !validateDate(endDate)) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
}

/**
 * Sanitize search string (remove special regex chars)
 */
export function sanitizeSearch(search: string): string {
  return search
    .trim()
    .substring(0, 100) // Limit length
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex special chars
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 */
export function validatePhone(phone: string): boolean {
  const regex = /^(\+62|0)[0-9]{9,12}$/;
  return regex.test(phone.replace(/\s/g, ""));
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];
    if (value === undefined || value === null || value === "") {
      errors.push({ field, message: `${field} is required` });
    }
  });

  return errors;
}

/**
 * Create API error response
 */
export function apiError(
  message: string,
  status: number = 400,
  errors?: ValidationError[],
) {
  return NextResponse.json(
    {
      success: false,
      status,
      message,
      ...(errors && { errors }),
    },
    { status },
  );
}

/**
 * Create API success response
 */
export function apiSuccess(data: any, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      status,
      data,
    },
    { status },
  );
}
