import type { Module } from 'vuex'
import { Project } from '@/types/project'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL

const toast = useToast()

export interface ProjectsState {
  projects: Project[]
  columnWidths: Record<string, number>
}

const state: ProjectsState = {
  projects: [],
  columnWidths: {},
}

const mutations = {
  setProjects(state: ProjectsState, projects: Project[]) {
    state.projects = projects
    localStorage.setItem('projects', JSON.stringify(projects))
  },
  addProject(state: ProjectsState, project: Project) {
    state.projects.push(project)
    localStorage.setItem('projects', JSON.stringify(state.projects))
  },
  updateProject(state: ProjectsState, project: Project) {
    const index = state.projects.findIndex((p) => p.id === project.id)
    if (index !== -1) {
      state.projects[index] = project
    }
    localStorage.setItem('projects', JSON.stringify(state.projects))
  },
  deleteProject(state: ProjectsState, projectId: number) {
    state.projects = state.projects.filter((p) => p.id !== projectId)
    localStorage.setItem('projects', JSON.stringify(state.projects))
  },
  updateColumnWidths(state: ProjectsState, widths: Record<string, number>) {
    state.columnWidths = widths
    localStorage.setItem('projectColumnWidths', JSON.stringify(widths))
  },
  setProject(state: ProjectsState, project: Project) {
    const index = state.projects.findIndex((p) => p.id === project.id)
    if (index !== -1) {
      state.projects[index] = project
    } else {
      state.projects.push(project)
    }
    localStorage.setItem('projects', JSON.stringify(state.projects))
  },
}

const actions = {
  async fetchProjects({ commit }: { commit: (mutation: string, payload: Project[]) => void }) {
    console.log('fetchProjects', BASE_API_URL)
    try {
      const response = await axios.get(`${BASE_API_URL}/projects`)
      commit('setProjects', response.data)
    } catch (error) {
      console.error('Ошибка при загрузке проектов:', error)
      toast.error('Помилка при завантаженні проектів')
    }
  },
  async fetchProjectById(
    {
      commit,
      state,
    }: { commit: (mutation: string, payload: Project) => void; state: ProjectsState },
    projectId: number,
  ) {
    try {
      const response = await axios.get(`${BASE_API_URL}/projects/${projectId}`)
      commit('setProject', response.data)
    } catch (error) {
      console.error(`Ошибка при загрузке проекта с ID ${projectId}:`, error)
      toast.error(`Помилка при завантаженні проекту з ID ${projectId}`)
    }
  },
  async addProject(
    { commit }: { commit: (mutation: string, payload: Project) => void },
    project: { name: string; description: string },
  ) {
    try {
      const newProject: Project = {
        ...project,
        taskCount: 0,
        status: 'To Do',
        createdAt: new Date().toISOString().split('T')[0],
      }
      const response = await axios.post(`${BASE_API_URL}/projects`, newProject)
      commit('addProject', response.data)
      toast.success('Проект успішно додано!')
    } catch (error) {
      console.error('Ошибка при добавлении проекта:', error)
      toast.error('Помилка при додаванні проекту')
      throw error
    }
  },
  async updateProject(
    { commit }: { commit: (mutation: string, payload: Project) => void },
    project: Project,
  ) {
    try {
      const response = await axios.put(`${BASE_API_URL}/projects/${project.id}`, project)
      commit('updateProject', response.data)
      toast.success('Проект успішно оновлено!')
    } catch (error) {
      console.error('Ошибка при обновлении проекта:', error)
      toast.error('Помилка при оновленні проекту')
      throw error
    }
  },
  async deleteProject(
    {
      commit,
      rootGetters,
      dispatch,
    }: {
      commit: (mutation: string, payload: number) => void
      rootGetters: any
      dispatch: (action: string, payload: any, options?: any) => Promise<void>
    },
    projectId: number,
  ) {
    try {
      const tasksToDelete = rootGetters['tasks/getTasksByProjectId'](projectId)

      for (const task of tasksToDelete) {
        await dispatch('tasks/deleteTask', task, { root: true })
      }

      await axios.delete(`${BASE_API_URL}/projects/${projectId}`)
      commit('deleteProject', projectId)
      toast.success('Проект успішно видалено!')
    } catch (error) {
      console.error('Ошибка при удалении проекта или связанных задач:', error)
      toast.error('Помилка при видаленні проекту або пов’язаних завдань')
      throw error
    }
  },
}

const getters = {
  getProjectById: (state: ProjectsState) => (projectId: number) => {
    return state.projects.find((p) => p.id === projectId)
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
} as Module<ProjectsState, any>
