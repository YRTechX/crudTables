<template>
  <v-container>
    <v-card>
      <v-card-title>
        Проєкти
        <div class="pt-2 text-end">
          <v-btn class="blue-btn" @click="modals.create = true">Додати проєкт</v-btn>
        </div>
      </v-card-title>
      <v-card-text>
        <ProjectsTable
          :headers="headers"
          :projects="filteredProjects"
          @sort="sortProjects"
          @edit="openEditModal"
          @delete="openDeleteModal"
        />
      </v-card-text>
    </v-card>

    <CustomModal
      v-if="newProject"
      v-model="modals.create"
      :loading="isLoading"
      :persistent="isLoading"
      @update:modelValue="modals.create = $event"
    >
      <template #title>Додати проєкт</template>
      <template #content>
        <v-form ref="createForm" @submit.prevent="createProject">
          <v-text-field
            v-model="newProject.name"
            label="Назва проєкту"
            required
            :rules="[(v) => !!v || 'Назва обов’язкова']"
          ></v-text-field>
          <v-textarea v-model="newProject.description" label="Опис проєкту" rows="3"></v-textarea>
        </v-form>
      </template>
      <template #actions>
        <v-btn
          type="submit"
          variant="elevated"
          class="blue-btn"
          :loading="isLoading"
          :disabled="isLoading"
          @click="createProject"
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
      v-if="editingProject"
      v-model="modals.edit"
      :loading="isLoading"
      :persistent="isLoading"
      @update:modelValue="modals.edit = $event"
    >
      <template #title>Редагувати проєкт</template>
      <template #content>
        <v-form ref="editForm" @submit.prevent="editProject">
          <v-text-field
            v-model="editingProject.name"
            label="Назва проєкту"
            required
            :rules="[(v) => !!v || 'Назва обов’язкова']"
          ></v-text-field>
          <v-textarea
            v-model="editingProject.description"
            label="Опис проєкту"
            rows="3"
          ></v-textarea>
          <v-select
            v-model="editingProject.status"
            label="Cтатус проєкту"
            rows="3"
            :items="statuses"
          ></v-select>
        </v-form>
      </template>
      <template #actions>
        <v-btn
          type="submit"
          variant="elevated"
          class="blue-btn"
          :loading="isLoading"
          :disabled="isLoading"
          @click="editProject"
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
      v-if="deletingProject"
      v-model="modals.delete"
      :loading="isLoading"
      :persistent="true"
      @update:modelValue="modals.delete = $event"
    >
      <template #title>Підтвердження видалення</template>
      <template #content>
        <p>Ви впевнені, що хочете видалити проєкт "{{ deletingProject?.name }}"?</p>
      </template>
      <template #actions>
        <v-btn
          color="error"
          variant="elevated"
          :loading="isLoading"
          :disabled="isLoading"
          @click="deleteProject"
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useStore } from '@/store'
import ProjectsTable from '@/components/ProjectsTable.vue'
import CustomModal from '@/components/CustomModal.vue'
import type { Project } from '@/types/project'
import { imitateLoadingTime } from '@/utills/functions'
import type { DataTableHeaders } from '@/types/common'
import type { VForm } from 'vuetify/components'

const store = useStore()
const search = ref('')
const statusFilter = ref('')
const modals = reactive({
  create: false,
  edit: false,
  delete: false,
})
const newProject = ref<Partial<Project>>({ name: '', description: '' })
const editingProject = ref<Partial<Project> | null>(null)
const deletingProject = ref<Project | null>(null)
const createForm = ref<InstanceType<typeof VForm>>()
const editForm = ref<InstanceType<typeof VForm>>()
const isLoading = ref<Boolean>(false)

const headers: DataTableHeaders[] = [
  { title: 'ID', key: 'id', sortable: true, width: 100 },
  { title: 'Назва', key: 'name', sortable: true, width: 200 },
  { title: 'Кількість завдань', key: 'taskCount', sortable: true, width: 150 },
  { title: 'Статус', key: 'status', sortable: true, width: 150 },
  { title: 'Дата створення', key: 'createdAt', sortable: true, width: 150 },
  { title: 'Дії', key: 'actions', sortable: false, width: 150 },
]
const statuses = computed(() => store.state.statuses)
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

async function closeModal(modalType: 'create' | 'edit' | 'delete') {
  modals[modalType] = false
  await imitateLoadingTime(100)
  switch (modalType) {
    case 'create':
      newProject.value = { name: '', description: '' }
      break
    case 'edit':
      editingProject.value = null
      break
    case 'delete':
      deletingProject.value = null
      break
  }
}

async function createProject() {
  const isValid = await createForm.value?.validate()
  if (isValid?.valid) {
    isLoading.value = true
    await imitateLoadingTime(1500)
    await store.dispatch('projects/addProject', newProject.value)
    closeModal('create')
    isLoading.value = false
  }
}

function openEditModal(project: Project) {
  editingProject.value = { ...project }
  modals.edit = true
}

async function editProject() {
  const isValid = await editForm.value?.validate()
  if (isValid?.valid) {
    isLoading.value = true
    await imitateLoadingTime(3000)
    await store.dispatch('projects/updateProject', editingProject.value)
    closeModal('edit')
    isLoading.value = false
  }
}

function openDeleteModal(project: Project) {
  deletingProject.value = project
  modals.delete = true
}

async function deleteProject() {
  if (deletingProject.value) {
    isLoading.value = true
    await imitateLoadingTime(3000)
    await store.dispatch('projects/deleteProject', deletingProject.value.id)
    closeModal('delete')
    isLoading.value = false
  }
}
</script>
