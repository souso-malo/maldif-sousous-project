export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'order';
  amount: number;
  description: string;
  date: Date;
  orderId?: string;
}

export interface Order {
  id: string;
  clientName: string;
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: Date;
}

export interface CashBox {
  balance: number;
  transactions: Transaction[];
  orders: Order[];
}