<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>Додати проєкт</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="project.name"
            label="Назва проєкту"
            required
            :rules="[(v) => !!v || 'Назва обов’язкова']"
          ></v-text-field>
          <v-textarea v-model="project.description" label="Опис проєкту" rows="3"></v-textarea>
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
  project: { name: string; description: string }
}>()

const emit = defineEmits(['save', 'close'])

const dialog = ref(true)
const project = ref({ ...props.project })

function submit() {
  emit('save', { ...project.value })
}

function close() {
  emit('close')
}
</script>
