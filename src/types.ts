export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
} 