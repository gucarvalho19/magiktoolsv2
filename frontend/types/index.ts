export interface User {
  email: string;
  name: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'ai' | 'utility';
  path: string;
  createdAt?: string;
}

export interface ToolResult {
  title: string;
  content: string;
  timestamp: string;
}
