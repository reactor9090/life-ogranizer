import { useMemo } from 'react';
import { isDone, isScheduled, useHabits } from '../habits/store';
import { useStore } from '../store/AppStore';
import { prioritiesFor, useToday } from './store';

/** Tot ce e de făcut azi, din toate aplicațiile — pentru progresul zilei. */
export function useDaySummary() {
  const { data, today } = useStore();
  const { todayData } = useToday();
  const { habitsData, active } = useHabits();

  return useMemo(() => {
    const prios = prioritiesFor(todayData, today).filter((p) => p.text.trim());
    const todos = todayData.todos.filter((t) => t.date === today);
    const habits = active.filter((h) => isScheduled(h, today));
    const geo = data.tasks.filter((t) => t.plannedDate === today);
    const parts = {
      priorities: { done: prios.filter((p) => p.done).length, total: prios.length },
      todos: { done: todos.filter((t) => t.done).length, total: todos.length },
      habits: { done: habits.filter((h) => isDone(habitsData, h, today)).length, total: habits.length },
      geo: { done: geo.filter((t) => t.status === 'completed').length, total: geo.length },
    };
    const done = Object.values(parts).reduce((a, p) => a + p.done, 0);
    const total = Object.values(parts).reduce((a, p) => a + p.total, 0);
    return { parts, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [data.tasks, todayData, habitsData, active, today]);
}
