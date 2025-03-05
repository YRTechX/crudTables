<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>Додати завдання</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit" ref="form">
          <v-text-field
            v-model="task.title"
            label="Назва завдання"
            required
            :rules="[(v) => !!v || 'Назва обов’язкова']"
          ></v-text-field>
          <v-select
            v-model="task.assignee"
            :items="assignees"
            label="Виконавець"
            required
            :rules="[(v) => !!v || 'Виконавець обов’язковий']"
          ></v-select>
          <v-select
            v-model="task.status"
            :items="['To Do', 'In Progress', 'Done']"
            label="Статус"
            required
          ></v-select>
          <v-text-field
            v-model="task.dueDate"
            label="Термін виконання"
            type="date"
            required
            :rules="[(v) => !!v || 'Термін обов’язковий']"
          ></v-text-field>
          <v-btn type="submit" color="primary">Зберегти</v-btn>
          <v-btn @click="close" color="secondary">Скасувати</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps<{
  task: { title: string; assignee: string; status: string; dueDate: string }
}>()

const emit = defineEmits(['save', 'close'])

const dialog = ref(true)
const task = ref({ ...props.task })
const assignees = ref(['Іван', 'Марія', 'Олександр'])
const form = ref()

function submit() {
  if (form.value?.validate()) {
    emit('save', { ...task.value })
  }
}

function close() {
  emit('close')
}
</script>
