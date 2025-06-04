import { useState, useEffect } from 'react';
import { Task } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Load tasks from localStorage
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const updated = [...prev, newTask];
      localStorage.setItem('tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      localStorage.setItem('tasks', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((task) => task.id !== id);
      localStorage.setItem('tasks', JSON.stringify(updated));
      return updated;
    });
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
  };
} 