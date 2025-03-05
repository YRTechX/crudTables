<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToProjects() {
  router.push('/projects')
}
</script>

<template>
  <v-container class="d-flex flex-column align-center justify-center" style="height: 100vh">
    <v-card class="elevation-3 pa-6" max-width="600">
      <v-card-title class="text-h4 text-center">Сторінка не знайдена</v-card-title>
      <v-card-text class="text-center text-subtitle-1">
        Вибачте, сторінка, яку ви шукаєте, не існує. Перевірте URL або поверніться на сторінку з
        проектами.
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn color="primary" @click="goToProjects">Проєкти</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped></style>
