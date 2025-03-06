<template>
  <v-container class="d-flex flex-column ga-5">
    <div class="pt-2">
      <v-btn class="blue-btn" @click="goBack">
        <v-icon left>mdi-arrow-left</v-icon>
        Назад
      </v-btn>
    </div>

    <v-card v-if="project">
      <v-card-title>Проект</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(item, index) in projectItemsForCardList" :key="index">
            <v-list-item-title>{{ item.label }}:</v-list-item-title>
            <v-list-item-subtitle>{{ item.value }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>
        Завдання
        <div class="pt-2 text-end">
          <v-btn class="blue-btn" @click="modals.createTask = true">
            <v-icon left>mdi-plus</v-icon>
            Додати завдання
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text>
        <TasksTable
          :headers="taskHeaders"
          :tasks="tasks"
          @update:widths="updateColumnWidths"
          @sort="sortTasks"
          @update:status="updateTaskStatus"
          @edit="openEditTaskModal"
          @delete="openDeleteTaskModal"
        />
      </v-card-text>
    </v-card>

    <CustomModal
      v-if="newTask"
      v-model="modals.createTask"
      :loading="isLoading"
      :persistent="isLoading"
      @update:modelValue="modals.createTask = $event"
    >
      <template #title>Додати завдання</template>
      <template #content>
        <v-form ref="taskForm" @submit.prevent="saveTask">
          <v-text-field
            v-model="newTask.title"
            label="Назва завдання"
            required
            :rules="[(v) => !!v || 'Назва обов’язкова']"
          ></v-text-field>
          <v-select
            v-model="newTask.assignee"
            :items="assignees"
            label="Виконавець"
            required
            :rules="[(v) => !!v || 'Виконавець обов’язковий']"
          ></v-select>
          <v-select
            v-model="newTask.status"
            :items="['To Do', 'In Progress', 'Done']"
            label="Статус"
            required
          ></v-select>
          <v-text-field
            v-model="newTask.dueDate"
            label="Термін виконання"
            type="date"
            required
            :rules="dueDateRules"
          ></v-text-field>
        </v-form>
      </template>
      <template #actions>
        <v-btn
          type="submit"
          variant="elevated"
          class="blue-btn"
          :loading="isLoading"
          :disabled="isLoading"
          @click="saveTask"
          >Зберегти</v-btn
        >
        <v-btn
          color="secondary"
          variant="elevated"
          :disabled="isLoading"
          @click="closeModal('createTask')"
          >Скасувати</v-btn
        >
      </template>
    </CustomModal>

    <CustomModal
      v-if="editingTask"
      v-model="modals.editTask"
      :loading="isLoading"
      :persistent="isLoading"
      @update:modelValue="modals.editTask = $event"
    >
      <template #title>Редагувати завдання</template>
      <template #content>
        <v-form ref="editTaskForm" @submit.prevent="editTask">
          <v-text-field
            v-model="editingTask.title"
            label="Назва завдання"
            required
            :rules="[(v) => !!v || 'Назва обов’язкова']"
          ></v-text-field>
          <v-select
            v-model="editingTask.assignee"
            :items="assignees"
            label="Виконавець"
            required
            :rules="[(v) => !!v || 'Виконавець обов’язковий']"
          ></v-select>
          <v-select
            v-model="editingTask.status"
            :items="['To Do', 'In Progress', 'Done']"
            label="Статус"
            required
          ></v-select>
          <v-text-field
            v-model="editingTask.dueDate"
            label="Термін виконання"
            type="date"
            required
            :rules="dueDateRules"
          ></v-text-field>
        </v-form>
      </template>
      <template #actions>
        <v-btn
          type="submit"
          variant="elevated"
          class="blue-btn"
          :loading="isLoading"
          :disabled="isLoading"
          @click="editTask"
          >Зберегти</v-btn
        >
        <v-btn
          color="secondary"
          variant="elevated"
          :disabled="isLoading"
          @click="closeModal('editTask')"
          >Скасувати</v-btn
        >
      </template>
    </CustomModal>

    <CustomModal
      v-if="deletingTask"
      v-model="modals.deleteTask"
      :loading="isLoading"
      :persistent="true"
      @update:modelValue="modals.deleteTask = $event"
    >
      <template #title>Підтвердження видалення</template>
      <template #content>
        <p>Ви впевнені, що хочете видалити завдання "{{ deletingTask?.title }}"?</p>
      </template>
      <template #actions>
        <v-btn
          color="error"
          variant="elevated"
          :loading="isLoading"
          :disabled="isLoading"
          @click="deleteTask"
          >Видалити</v-btn
        >
        <v-btn
          color="secondary"
          variant="elevated"
          :disabled="isLoading"
          @click="closeModal('deleteTask')"
          >Скасувати</v-btn
        >
      </template>
    </CustomModal>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/store'
import TasksTable from '@/components/TasksTable.vue'
import CustomModal from '@/components/CustomModal.vue'
import type { Task } from '@/types/task'
import type { Project } from '@/types/project'
import { imitateLoadingTime } from '@/utills/functions'

const route = useRoute()
const router = useRouter()
const store = useStore()
const projectId = route.params.projectId
const search = ref('')
const statusFilter = ref('')
const isLoading = ref(false)
const newTask = ref({ title: '', assignee: '', status: 'To Do', dueDate: '', projectId: 0 })
const editingTask = ref<Task>({
  id: 0,
  title: '',
  assignee: '',
  status: 'To Do',
  dueDate: '',
  projectId: 0,
})
const deletingTask = ref<Task | null>(null)
const taskForm = ref()
const editTaskForm = ref()
const modals = reactive({
  createTask: false,
  editTask: false,
  deleteTask: false,
})

const assignees = computed(() => store.state.assignees)
const project = computed(() => store.getters['projects/getProjectById'](projectId))
console.log('relatedProject', project.value)
const projectItemsForCardList = computed(() => {
  if (!project.value) return []
  return Object.entries(project.value).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    value: value,
  }))
})
const tasks = computed(() => store.getters['tasks/getTasksByProjectId'](projectId))

watch(tasks, (newTasks) => {
  console.log('Tasks updated:', newTasks)
})

onMounted(async () => {
  const projectsLoaded = store.state.projects.projects.length > 0
  console.log('projectsLoaded', projectsLoaded)

  if (!projectsLoaded) {
    await store.dispatch('projects/fetchProjectById', projectId)
  }
  await store.dispatch('tasks/fetchTasks', projectId)
})

const taskHeaders = [
  { title: 'ID', key: 'id', sortable: true, width: 100 },
  { title: 'Назва', key: 'title', sortable: true, width: 200 },
  { title: 'Виконавець', key: 'assignee', sortable: true, width: 150 },
  { title: 'Статус', key: 'status', sortable: true, width: 150 },
  { title: 'Термін', key: 'dueDate', sortable: true, width: 150 },
  { title: 'Дії', key: 'actions', sortable: false, width: 100 },
]

// Правила валидации для dueDate
const dueDateRules = [
  (v: string) => !!v || 'Термін обов’язковий',
  (v: string) => {
    if (!v) return true
    const selectedDate = new Date(v)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today || 'Дата не може бути раніше за сьогодні'
  },
  (v: string) => {
    if (!v) return true
    const year = parseInt(v.slice(0, v.indexOf('-')), 10)
    console.log('year', year)
    return (year >= 1000 && year <= 9999) || 'Рік має бути чотиризначним числом (наприклад, 2025)'
  },
]

async function sortTasks(oldIndex: number, newIndex: number) {
  await store.dispatch('tasks/reorderTasks', { oldIndex, newIndex })
}

async function updateColumnWidths(newWidths: Record<string, number>) {}

async function updateTaskStatus(taskId: number, newStatus: string) {
  const task = tasks.value.find((t: Task) => t.id === taskId)
  if (task) {
    await store.dispatch('tasks/updateTask', { ...task, status: newStatus })
  }
}

async function saveTask() {
  const isValid = await taskForm.value?.validate()
  if (isValid?.valid) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    const taskToSave = { ...newTask.value, projectId }
    await store.dispatch('tasks/addTask', taskToSave)
    closeModal('createTask')
    isLoading.value = false
  }
}

function openEditTaskModal(task: Task) {
  editingTask.value = { ...task }
  modals.editTask = true
}

async function editTask() {
  const isValid = await editTaskForm.value?.validate()
  if (isValid?.valid) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    await store.dispatch('tasks/updateTask', editingTask.value)
    closeModal('editTask')
    isLoading.value = false
  }
}

function openDeleteTaskModal(task: Task) {
  deletingTask.value = task
  modals.deleteTask = true
}

async function deleteTask() {
  if (deletingTask.value) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    await store.dispatch('tasks/deleteTask', deletingTask.value.id)
    closeModal('deleteTask')
    isLoading.value = false
  }
}

async function closeModal(modalType: 'createTask' | 'editTask' | 'deleteTask') {
  modals[modalType] = false
  await imitateLoadingTime(100)
  switch (modalType) {
    case 'createTask':
      newTask.value = { title: '', assignee: '', status: 'To Do', dueDate: '', projectId: 0 }
      break
    case 'editTask':
      editingTask.value = {
        id: 0,
        title: '',
        assignee: '',
        status: 'To Do',
        dueDate: '',
        projectId: 0,
      }
      break
    case 'deleteTask':
      deletingTask.value = null
      break
  }
}

function goBack() {
  router.push('/projects')
}
</script>
