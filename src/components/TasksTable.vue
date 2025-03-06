<template>
  <v-data-table
    :headers="headers"
    :items="tasks"
    :items-per-page="10"
    class="elevation-1 custom-header"
    :sort-by="sortBy"
    @update:sort-by="updateSort"
    @update:options="updateWidths"
  >
    <template v-slot:item="{ item }">
      <tr style="cursor: pointer">
        <td>{{ item.id }}</td>
        <td>{{ item.title }}</td>
        <td>{{ item.assignee }}</td>
        <td>
          {{ item.status }}
        </td>
        <td>{{ item.dueDate }}</td>
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
import { ref, defineProps, defineEmits, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  headers: { title: string; key: string; sortable?: boolean; width: number }[]
  tasks: any[]
}>()

const emit = defineEmits(['update:widths', 'sort', 'update:status', 'edit', 'delete'])

const router = useRouter()
const sortBy = ref([{ key: 'title', order: 'asc' }])

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
/* function updateStatus(taskId: number, newStatus: string) {
  emit('update:status', taskId, newStatus)
} */
</script>

<style></style>
