import type { Statuses } from '@/types/common'
export interface Project {
  id?: string | number
  name: string
  description: string
  taskCount: number
  status: Statuses
  createdAt: string
}
