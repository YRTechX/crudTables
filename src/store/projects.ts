import type { Module } from 'vuex'
import { Project } from '@/types/project'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import type { SortItem, Filters } from '@/types/common'
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL

const toast = useToast()

export interface ProjectsState {
  projects: Project[]
  columnWidths: Record<string, number>
  sorting: SortItem[]
  filters: Filters
}

const state: ProjectsState = {
  projects: [],
  columnWidths: {},
  sorting: [],
  filters: {},
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
  SET_SORTING(state: ProjectsState, sorting: SortItem[]) {
    state.sorting = sorting
  },
  SET_FILTERS(state: ProjectsState, filters: Filters) {
    state.filters = filters
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

      if (tasksToDelete && tasksToDelete.length > 0) {
        for (const task of tasksToDelete) {
          await dispatch('tasks/deleteTask', { task }, { root: true })
        }
        toast.success('Усі завдання проекту успішно видалено!')
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
  saveSorting(
    { commit }: { commit: (mutation: string, payload: SortItem[]) => void },
    sorting: SortItem[],
  ) {
    try {
      localStorage.setItem('projectsTableSorting', JSON.stringify(sorting))
    } catch (e) {
      console.error('Storage save sorting error', e)
    }
    commit('SET_SORTING', sorting)
  },
  loadSorting({ commit }: { commit: (mutation: string, payload: SortItem[]) => void }) {
    try {
      const storedSorting = localStorage.getItem('projectsTableSorting')
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
  saveFilters(
    { commit }: { commit: (mutation: string, payload: Filters) => void },
    filters: Filters,
  ) {
    try {
      localStorage.setItem('projectsTableFilters', JSON.stringify(filters))
    } catch (e) {
      console.error('Storage save sorting error', e)
    }
    commit('SET_FILTERS', filters)
  },
  loadFilters({ commit }: { commit: (mutation: string, payload: Filters) => void }) {
    try {
      const storedFilters = localStorage.getItem('projectsTableFilters')
      console.log('storedFilters', storedFilters)
      if (!storedFilters) return

      const parsed: unknown = JSON.parse(storedFilters)

      commit('SET_FILTERS', parsed as Filters)
    } catch (e) {
      console.error('Ошибка загрузки фильтров:', e)
      commit('SET_FILTERS', [])
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
