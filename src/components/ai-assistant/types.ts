export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  quickActions?: QuickAction[];
  pendingTrade?: { side: string; symbol: string; qty: number; reasoning?: string };
  tradeResult?: { success: boolean; orderId?: string; error?: string };
}

export interface QuickAction {
  label: string;
  navigateTo?: string;
  tradeQuickAction?: 'confirm' | 'cancel';
  pendingTrade?: { side: string; symbol: string; qty: number; reasoning?: string };
}
