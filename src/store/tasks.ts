import { Module } from 'vuex'
import { Task, TaskStatus } from '@/types/task'
import axios from 'axios'

export interface TasksState {
  tasks: Record<number, Task[]>
  columnWidths: Record<string, number>
}

const state: TasksState = {
  tasks: {},
  columnWidths: {},
}

const mutations = {
  setTasks(state: TasksState, { projectId, tasks }: { projectId: number; tasks: Task[] }) {
    state.tasks[projectId] = tasks
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  addTask(state: TasksState, { projectId, task }: { projectId: number; task: Task }) {
    if (!state.tasks[projectId]) state.tasks[projectId] = []
    state.tasks[projectId].push(task)
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  updateTask(state: TasksState, { projectId, task }: { projectId: number; task: Task }) {
    const tasks = state.tasks[projectId]
    const index = tasks.findIndex((t) => t.id === task.id)
    if (index !== -1) {
      tasks[index] = task
    }
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  deleteTask(state: TasksState, { projectId, taskId }: { projectId: number; taskId: number }) {
    if (state.tasks[projectId]) {
      state.tasks[projectId] = state.tasks[projectId].filter((t) => t.id !== taskId)
    }
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  reorderTasks(
    state: TasksState,
    { projectId, oldIndex, newIndex }: { projectId: number; oldIndex: number; newIndex: number },
  ) {
    const tasks = state.tasks[projectId]
    const [movedTask] = tasks.splice(oldIndex, 1)
    tasks.splice(newIndex, 0, movedTask)
    localStorage.setItem('tasks', JSON.stringify(state.tasks))
  },
  sortTasks(
    state: TasksState,
    { projectId, key, order }: { projectId: number; key: string; order: 'asc' | 'desc' },
  ) {
    const tasks = state.tasks[projectId]
    tasks.sort((a, b) => {
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
  async fetchTasks({ commit }, projectId: number) {
    try {
      const response = await axios.get(`http://localhost:3000/tasks?projectId=${projectId}`)
      commit('setTasks', { projectId, tasks: response.data })
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error)
    }
  },
  async addTask({ commit }, { projectId, task }: { projectId: number; task: Task }) {
    try {
      const response = await axios.post('http://localhost:3000/tasks', {
        ...task,
        projectId,
        id: Date.now(),
      })
      commit('addTask', { projectId, task: response.data })
    } catch (error) {
      console.error('Ошибка при добавлении задачи:', error)
    }
  },
  async updateTask({ commit }, { projectId, task }: { projectId: number; task: Task }) {
    try {
      const response = await axios.put(`http://localhost:3000/tasks/${task.id}`, task)
      commit('updateTask', { projectId, task: response.data })
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error)
    }
  },
  async deleteTask({ commit }, { projectId, taskId }: { projectId: number; taskId: number }) {
    try {
      await axios.delete(`http://localhost:3000/tasks/${taskId}`)
      commit('deleteTask', { projectId, taskId })
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error)
    }
  },
}

const getters = {
  getTasksByProjectId: (state: TasksState) => (projectId: number) => {
    return state.tasks[projectId] || []
  },
  getTaskById: (state: TasksState) => (projectId: number, taskId: number) => {
    return state.tasks[projectId]?.find((t) => t.id === taskId)
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
} as Module<TasksState, any>
