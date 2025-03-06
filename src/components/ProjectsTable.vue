<template>
  <v-data-table
    :headers="headers"
    :items="projects"
    :items-per-page="10"
    class="elevation-1 custom-header"
    :sort-by="sortBy"
    @update:sort-by="updateSort"
    @update:options="updateWidths"
  >
    <template v-slot:item="{ item }">
      <tr @click="goToProject(item.id)" style="cursor: pointer">
        <td>{{ item.id }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.taskCount }}</td>
        <td>{{ item.status }}</td>
        <td>{{ item.createdAt }}</td>
        <td>
          <v-btn
            icon="mdi-pencil"
            variant="text"
            @click.stop="emit('edit', item)"
            size="small"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            color="error"
            variant="text"
            size="small"
            @click.stop="emit('delete', item)"
          ></v-btn>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  headers: any[]
  projects: any[]
}>()

const emit = defineEmits(['update:widths', 'sort', 'edit', 'delete'])

const router = useRouter()
const sortBy = ref([{ key: 'name', order: 'asc' }])

function updateSort(newSort: any) {
  emit('sort', newSort[0].key, newSort[0].order)
}

function updateWidths(options: any) {
  /* const widths = props.headers.reduce(
    (acc, header) => ({
      ...acc,
      [header.key]: options.headers.find((h: any) => h.key === header.key)?.width || 100,
    }),
    {},
  )
  emit('update:widths', widths) */
}

function goToProject(projectId: number) {
  router.push(`/projects/${projectId}`)
}
</script>
