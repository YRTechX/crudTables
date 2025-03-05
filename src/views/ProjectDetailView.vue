<template>
  <v-container>
    <v-card>
      <!--  <v-card-title>{{ project.name }}</v-card-title> -->
      <v-card-text>
        <v-btn color="primary" @click="showTaskModal = true">Додати завдання</v-btn>
        <!--  <FilterPanel v-model:search="search" v-model:statusFilter="statusFilter" /> -->
        <TasksTable
          :headers="taskHeaders"
          :tasks="filteredTasks"
          @update:widths="updateColumnWidths"
          @sort="sortTasks"
          @update:status="updateTaskStatus"
        />
      </v-card-text>
    </v-card>
    <TaskModal
      v-if="showTaskModal"
      :task="newTask"
      @close="showTaskModal = false"
      @save="saveTask"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from '@/store'
import TasksTable from '@/components/TasksTable.vue'
/* import FilterPanel from '@/components/FilterPanel.vue' */
import TaskModal from '@/components/TaskModal.vue'
import type { Task } from '@/types/task'

const route = useRoute()
const store = useStore()
const projectId = Number(route.params.projectId)
const search = ref('')
const statusFilter = ref('')
const showTaskModal = ref(false)
const newTask = ref({ title: '', assignee: '', status: 'To Do', dueDate: '' })
console.log('projectId', projectId)

const project = computed(() => store.getters['projects/getProjectById'](projectId))
console.log('relatedProject', project.value)

const tasks = computed(() => store.getters['tasks/getTasksByProjectId'](projectId))
console.log('tasks', tasks.value)
const filteredTasks = computed(() => {
  return tasks.value.filter((task: Task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.value.toLowerCase()) ||
      task.assignee.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = !statusFilter.value || task.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

onMounted(async () => {
  await store.dispatch('tasks/fetchTasks', { projectId })
})
const taskHeaders = [
  { title: 'ID', key: 'id', sortable: true, width: 100 },
  { title: 'Назва', key: 'title', sortable: true, width: 200 },
  { title: 'Виконавець', key: 'assignee', sortable: true, width: 150 },
  { title: 'Статус', key: 'status', sortable: true, width: 150 },
  { title: 'Термін', key: 'dueDate', sortable: true, width: 150 },
]

async function sortTasks(key: string, order: 'asc' | 'desc') {
  /* await store.dispatch('tasks/sortTasks', { projectId, key, order }) */
}

async function updateColumnWidths(newWidths: Record<string, number>) {
  /* store.commit('tasks/updateColumnWidths', newWidths) */
}

async function updateTaskStatus(taskId: number, newStatus: string) {
  /* await store.dispatch('tasks/updateTask', { projectId, task: { id: taskId, status: newStatus } }) */
}

async function saveTask(task: {
  title: string
  assignee: string
  status: string
  dueDate: string
}) {
  /* await store.dispatch('tasks/addTask', { projectId, task: { ...task, id: Date.now() } })
  showTaskModal.value = false
  newTask.value = { title: '', assignee: '', status: 'To Do', dueDate: '' } */
}

function saveState() {
  /*  localStorage.setItem('projects', JSON.stringify(projectStore.projects))
  localStorage.setItem('tasks', JSON.stringify(projectStore.tasks)) */
}
</script>
