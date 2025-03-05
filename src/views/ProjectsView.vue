<template>
  <v-container>
    <v-card>
      <v-card-title>
        Проєкти
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="showProjectModal = true">Додати проєкт</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- <FilterPanel v-model:search="search" v-model:statusFilter="statusFilter" /> -->
        <ProjectsTable
          :headers="headers"
          :projects="filteredProjects"
          @update:widths="updateColumnWidths"
          @sort="sortProjects"
        />
      </v-card-text>
    </v-card>
    <ProjectModal
      v-if="showProjectModal"
      :project="newProject"
      @close="showProjectModal = false"
      @save="saveProject"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import ProjectsTable from '@/components/ProjectsTable.vue'
// import FilterPanel from '@/components/FilterPanel.vue'
import ProjectModal from '@/components/ProjectModal.vue'
import type { Project } from '@/types/project'

const router = useRouter()
const store = useStore()
const search = ref('')
const statusFilter = ref('')
const showProjectModal = ref(false)
const newProject = ref({ name: '', description: '' })

const headers = [
  { title: 'ID', key: 'id', sortable: true, width: 100 },
  { title: 'Назва', key: 'name', sortable: true, width: 200 },
  { title: 'Кількість завдань', key: 'taskCount', sortable: true, width: 150 },
  { title: 'Статус', key: 'status', sortable: true, width: 150 },
  { title: 'Дата створення', key: 'createdAt', sortable: true, width: 150 },
]

const projects = computed(() => store.state.projects.projects)

onMounted(async () => {
  await store.dispatch('projects/fetchProjects')
})

const filteredProjects = computed(() => {
  return projects.value.filter((project: Project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = !statusFilter.value || project.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function sortProjects(key: string, order: 'asc' | 'desc') {
  /* store.commit('projects/sortProjects', { key, order }) */
}

function updateColumnWidths(newWidths: Record<string, number>) {
  /* store.commit('projects/updateColumnWidths', newWidths) */
}

async function saveProject(project: { name: string; description: string }) {
  /*  await store.dispatch('projects/addProject', project)
  showProjectModal.value = false
  newProject.value = { name: '', description: '' } */
}

function goToProject(projectId: number) {
  router.push(`/projects/${projectId}`)
}
</script>
