/**
 * Type definitions for the mobile banking app
 * Add global types and interfaces here
 */

// Placeholder for future types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  type: 'checking' | 'savings';
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: 'debit' | 'credit';
}
