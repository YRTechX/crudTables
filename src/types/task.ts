import type { Statuses } from '@/types/common'
export interface Task {
  id?: string | number
  projectId: number
  title: string
  assignee: string
  status: Statuses
  dueDate: string
}
