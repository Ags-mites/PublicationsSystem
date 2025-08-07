import { BadRequestException } from '@nestjs/common';
export class ValidationUtils {
  static validateUuid(value: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }
  }
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  static validateIsbn(isbn: string): boolean {
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    return /^\d{10}$|^\d{13}$/.test(cleanIsbn);
  }
  static sanitizeString(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }
}