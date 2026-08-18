import { request } from './apiClient';
import { Transaction } from '../types';

export interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface RevenueAnalytics {
  totalDepositsVnd: number;
  totalComputeFeesBilledVnd: number;
  grossMarginPercent: number;
}

export const walletApi = {
  getWallet: async (): Promise<WalletInfo> => {
    return request<WalletInfo>('/wallet');
  },

  topUp: async (amount: number, method: 'VietQR' | 'VNPay' | 'MoMo'): Promise<Transaction> => {
    return request<Transaction>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod: method }),
    });
  },

  adminAdjustBalance: async (userId: string, amount: number): Promise<Transaction> => {
    return request<Transaction>('/wallet/admin/credit', {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    });
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return request<Transaction[]>('/transactions');
  },

  getBillingAnalytics: async (): Promise<RevenueAnalytics> => {
    return request<RevenueAnalytics>('/billing/analytics');
  },
};
