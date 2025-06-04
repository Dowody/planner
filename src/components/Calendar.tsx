import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { tasks } = useTasks();

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc: Record<string, Task[]>, task) => {
      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-card-foreground">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="border-border hover:bg-muted text-card-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="border-border hover:bg-muted text-card-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium bg-muted text-muted-foreground py-2 border-b border-border"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];

          return (
            <div
              key={dateKey}
              className={`
                min-h-[100px] p-2 rounded-lg bg-card text-card-foreground
                ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
                ${isToday(day) ? 'bg-muted border border-blue-500' : 'border border-border'}
                hover:bg-muted transition-colors
              `}
            >
              <div className="text-sm font-medium mb-1 text-card-foreground">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task: Task) => (
                  <div
                    key={task.id}
                    className={`
                      text-xs p-1 rounded truncate
                      ${task.completed ? 'bg-muted text-muted-foreground' : 'bg-blue-900 text-blue-200'}
                    `}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
} 