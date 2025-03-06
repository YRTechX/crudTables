import type { Project } from '@/types/project'
import type { Task } from '@/types/task'

export type Statuses = 'To Do' | 'In Progress' | 'Done'
export interface RootState {
  statuses: Statuses[]
  projects: Project
  tasks: Task
}
