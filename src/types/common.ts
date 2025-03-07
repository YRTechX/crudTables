import type { Project } from '@/types/project'
import type { Task } from '@/types/task'
export type Statuses = 'To Do' | 'In Progress' | 'Done'
export interface RootState {
  statuses: Statuses[]
  assignees: String[]
  projects: Project
  tasks: Task
}
export interface DataTableHeaders {
  title: string
  key: string
  sortable: boolean
  width: number
  filterable: boolean
}
export interface ModalsState {
  create: boolean
  edit: boolean
  delete: boolean
}
export interface SortItem {
  key: string
  order: 'asc' | 'desc'
}
