import type { Module } from 'vuex'
import type { Task } from '@/types/task'
import axios from 'axios'
import type { NumberOrString } from '@/types/common'
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL

export interface TasksState {
  tasks: Task[]
  columnWidths: Record<string, number>
}

const state: TasksState = {
  tasks: [],
  columnWidths: {},
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
  deleteTask(state: TasksState, taskId: NumberOrString) {
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
}

const actions = {
  async fetchTasks(
    { commit }: { commit: (mutation: string, payload: Task[]) => void },
    projectId: string,
  ) {
    console.log('projectId in fetch tasks', projectId)
    try {
      const response = await axios.get(`${BASE_API_URL}/tasks?projectId=${projectId}`)
      console.log('response with tasks', response)
      commit('setTasks', response.data)
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error)
    }
  },
  async addTask({ commit }: { commit: (mutation: string, payload: Task) => void }, task: Task) {
    try {
      const response = await axios.post(`${BASE_API_URL}/tasks`, {
        ...task,
        id: Date.now(),
      })
      commit('addTask', response.data)
    } catch (error) {
      console.error('Ошибка при добавлении задачи:', error)
    }
  },
  async updateTask({ commit }: { commit: (mutation: string, payload: Task) => void }, task: Task) {
    try {
      const response = await axios.put(`${BASE_API_URL}/tasks/${task.id}`, task)
      commit('updateTask', response.data)
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error)
    }
  },
  async deleteTask(
    { commit }: { commit: (mutation: string, payload: number) => void },
    taskId: NumberOrString,
  ) {
    try {
      await axios.delete(`${BASE_API_URL}/tasks/${String(taskId)}`)
      commit('deleteTask', taskId)
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error)
    }
  },
}

const getters = {
  getTasksByProjectId: (state: TasksState) => (projectId: string) => {
    return state.tasks.filter((task) => task.projectId === projectId)
  },
  getTaskById: (state: TasksState) => (taskId: NumberOrString) => {
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
