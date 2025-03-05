import type { Statuses } from '@/types/common'
export interface Task {
  id: number
  projectId: number
  title: string
  assignee: string
  status: Statuses
  dueDate: string
}
