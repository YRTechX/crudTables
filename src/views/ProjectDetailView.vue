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
          <v-btn class="blue-btn" @click="modals.create = true">
            <v-icon left>mdi-plus</v-icon>
            Додати завдання
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text>
        <TasksTable
          :headers="taskHeaders"
          :tasks="tasks"
          @edit="openEditTaskModal"
          @delete="openDeleteTaskModal"
        />
      </v-card-text>
    </v-card>

    <CustomModal
      v-if="newTask"
      v-model="modals.create"
      :loading="isLoading"
      :persistent="isLoading"
      @update:modelValue="modals.create = $event"
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
          @click="closeModal('create')"
          >Скасувати</v-btn
        >
      </template>
    </CustomModal>

    <CustomModal
      v-if="editingTask"
      v-model="modals.edit"
      :loading="isLoading"
      :persistent="isLoading"
      @update:modelValue="modals.edit = $event"
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
          @click="closeModal('edit')"
          >Скасувати</v-btn
        >
      </template>
    </CustomModal>

    <CustomModal
      v-if="deletingTask"
      v-model="modals.delete"
      :loading="isLoading"
      :persistent="true"
      @update:modelValue="modals.delete = $event"
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
          @click="closeModal('delete')"
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
import { imitateLoadingTime } from '@/utills/functions'
import type { ModalState } from '@/types/common'
import type { VForm } from 'vuetify/components'
const route = useRoute()
const router = useRouter()
const store = useStore()
const projectId = Number(route.params.projectId)
const isLoading = ref<boolean>(false)
const newTask = ref<Partial<Task>>({ title: '', assignee: '', status: 'To Do', dueDate: '' })
const editingTask = ref<Partial<Task>>({
  title: '',
  assignee: '',
  status: 'To Do',
  dueDate: '',
})
const deletingTask = ref<Task | null>(null)
const taskForm = ref<InstanceType<typeof VForm>>()
const editTaskForm = ref<InstanceType<typeof VForm>>()
const modals = reactive<ModalState>({
  create: false,
  edit: false,
  delete: false,
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

onMounted(async () => {
  const projectsLoaded = store.state.projects.projects.length > 0
  console.log('projectsLoaded', projectsLoaded)

  if (!projectsLoaded) {
    await store.dispatch('projects/fetchProjectById', projectId)
  }
  await store.dispatch('tasks/fetchTasks', projectId)
})

const taskHeaders = [
  { title: 'ID', key: 'id', sortable: false, filterable: false, width: 100 },
  { title: 'Назва', key: 'title', sortable: false, filterable: false, width: 200 },
  {
    title: 'Виконавець',
    key: 'assignee',
    sortable: false,
    filterable: true,
    width: 150,
    filterTitle: 'Фiльтр за виконацвем',
  },
  {
    title: 'Статус',
    key: 'status',
    sortable: true,
    filterable: true,
    width: 150,
    filterTitle: 'Фiльтр за статусом',
  },
  { title: 'Термін', key: 'dueDate', sortable: true, filterable: false, width: 150 },
  { title: 'Дії', key: 'actions', sortable: false, filterable: false, width: 100 },
]

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

async function saveTask() {
  const isValid = await taskForm.value?.validate()
  if (isValid?.valid) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    const taskToSave = { ...newTask.value, projectId }
    await store.dispatch('tasks/addTask', taskToSave)
    closeModal('create')
    isLoading.value = false
  }
}

function openEditTaskModal(task: Task) {
  editingTask.value = { ...task }
  modals.edit = true
}

async function editTask() {
  const isValid = await editTaskForm.value?.validate()
  if (isValid?.valid) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    await store.dispatch('tasks/updateTask', editingTask.value)
    closeModal('edit')
    isLoading.value = false
  }
}

function openDeleteTaskModal(task: Task) {
  deletingTask.value = task
  modals.delete = true
}

async function deleteTask() {
  if (deletingTask.value) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    await store.dispatch('tasks/deleteTask', {
      task: deletingTask.value,
      shouldRefetch: true,
    })
    closeModal('delete')
    isLoading.value = false
  }
}

async function closeModal(modalType: 'create' | 'edit' | 'delete') {
  modals[modalType] = false
  await imitateLoadingTime(100)
  switch (modalType) {
    case 'create':
      newTask.value = { title: '', assignee: '', status: 'To Do', dueDate: '' }
      break
    case 'edit':
      editingTask.value = null
      break
    case 'delete':
      deletingTask.value = null
      break
  }
}

function goBack() {
  router.push('/projects')
}
</script>
