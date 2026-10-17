export interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  fiatValueUSD: number;
  change24h: number;
  iconUrl?: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  tokenSymbol: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  fromAddress: string;
  toAddress: string;
  txHash: string;
}

export interface UserWallet {
  address: string;
  totalBalanceUSD: number;
  tokens: Token[];
  recentTransactions: Transaction[];
}
