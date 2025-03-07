import type { Module } from 'vuex'
import type { Task } from '@/types/task'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import type { SortItem } from '@/types/common'
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL

const toast = useToast()

export interface TasksState {
  tasks: Task[]
  columnWidths: Record<string, number>
  sorting: SortItem[]
}

const state: TasksState = {
  tasks: [],
  columnWidths: {},
  sorting: [],
}

const mutations = {
  setTasks(state: TasksState, tasks: Task[]) {
    state.tasks = tasks
    localStorage.setItem('tasks', JSON.stringify(tasks))
  },
  addTask(state: TasksState, task: Task) {
    state.tasks.push(task)
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  updateTask(state: TasksState, task: Task) {
    const index = state.tasks.findIndex((t) => t.id === task.id)
    if (index !== -1) {
      state.tasks[index] = task
    }
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  deleteTask(state: TasksState, taskId: number) {
    state.tasks = state.tasks.filter((t) => t.id !== taskId)
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  reorderTasks(state: TasksState, { oldIndex, newIndex }: { oldIndex: number; newIndex: number }) {
    const [movedTask] = state.tasks.splice(oldIndex, 1)
    state.tasks.splice(newIndex, 0, movedTask)
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  sortTasks(state: TasksState, { key, order }: { key: string; order: 'asc' | 'desc' }) {
    state.tasks.sort((a, b) => {
      const valueA = a[key as keyof Task]
      const valueB = b[key as keyof Task]
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }
      return order === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number)
    })
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  updateColumnWidths(state: TasksState, widths: Record<string, number>) {
    state.columnWidths = widths
    localStorage.setItem('taskColumnWidths', JSON.stringify(widths))
  },
  SET_SORTING(state: TasksState, sorting: SortItem[]) {
    state.sorting = sorting
  },
}

const actions = {
  async fetchTasks(
    { commit }: { commit: (mutation: string, payload: Task[]) => void },
    projectId: number,
  ) {
    try {
      const response = await axios.get(`${BASE_API_URL}/tasks?projectId=${projectId}`)
      console.log('response with tasks', response)
      commit('setTasks', response.data)
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error)
      toast.error('Помилка при завантаженні завдань')
    }
  },
  async addTask(
    {
      commit,
      dispatch,
    }: {
      commit: (mutation: string, payload: Task) => void
      dispatch: (action: string, payload?: any, options?: { root: boolean }) => Promise<any>
    },
    task: Task,
  ) {
    try {
      const response = await axios.post(`${BASE_API_URL}/tasks`, {
        ...task,
        id: Date.now(),
      })
      commit('addTask', response.data)
      toast.success('Завдання успішно додано!')

      await dispatch('projects/fetchProjectById', task.projectId, { root: true })
    } catch (error) {
      console.error('Ошибка при добавлении задачи:', error)
      toast.error('Помилка при додаванні завдання')
      throw error
    }
  },
  async updateTask({ commit }: { commit: (mutation: string, payload: Task) => void }, task: Task) {
    try {
      const response = await axios.put(`${BASE_API_URL}/tasks/${task.id}`, task)
      commit('updateTask', response.data)
      toast.success('Завдання успішно оновлено!')
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error)
      toast.error('Помилка при оновленні завдання')
      throw error
    }
  },
  async deleteTask(
    {
      commit,
      dispatch,
    }: {
      commit: (mutation: string, payload: number) => void
      dispatch: (action: string, payload: any, options?: { root: boolean }) => Promise<any>
    },
    { task, shouldRefetch = false }: { task: Task; shouldRefetch?: boolean },
  ) {
    try {
      await axios.delete(`${BASE_API_URL}/tasks/${task.id}`)
      commit('deleteTask', task.id)

      if (shouldRefetch) {
        toast.success('Завдання успішно видалено!')
        await dispatch('projects/fetchProjectById', task.projectId, { root: true })
      }
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error)
      toast.error('Помилка при видаленні завдання')
    }
  },
  saveSorting(
    { commit }: { commit: (mutation: string, payload: SortItem[]) => void },
    sorting: SortItem[],
  ) {
    try {
      localStorage.setItem('tasksTableSorting', JSON.stringify(sorting))
    } catch (e) {
      console.error('Storage save sorting error', e)
    }
    commit('SET_SORTING', sorting)
  },
  loadSorting({ commit }: { commit: (mutation: string, payload: SortItem[]) => void }) {
    try {
      const storedSorting = localStorage.getItem('tasksTableSorting')
      if (!storedSorting) return

      const parsed: unknown = JSON.parse(storedSorting)
      const isValid =
        Array.isArray(parsed) &&
        parsed.every(
          (item) =>
            typeof item === 'object' &&
            'key' in item &&
            'order' in item &&
            typeof item.key === 'string' &&
            ['asc', 'desc'].includes(item.order),
        )

      if (isValid) {
        commit('SET_SORTING', parsed as SortItem[])
      } else {
        console.error('Невалидные данные сортировки:', parsed)
        commit('SET_SORTING', [])
      }
    } catch (e) {
      console.error('Ошибка загрузки сортировки:', e)
      commit('SET_SORTING', [])
    }
  },
}

const getters = {
  getTasksByProjectId: (state: TasksState) => (projectId: number) => {
    return state.tasks.filter((task) => task.projectId === projectId)
  },
  getTaskById: (state: TasksState) => (taskId: number) => {
    return state.tasks.find((t) => t.id === taskId)
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
} as Module<TasksState, any>
