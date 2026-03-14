export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  quickActions?: QuickAction[];
}

export interface QuickAction {
  label: string;
  navigateTo?: string;
}
