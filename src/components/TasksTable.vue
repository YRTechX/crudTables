<template>
  <v-data-table
    :headers="headers"
    :items="filteredTasks"
    :items-per-page="10"
    class="elevation-1 custom-header"
    v-model:sort-by="sortBy"
    @update:sort-by="handleSortChange"
  >
    <template
      v-for="header in filterableHeaders"
      :key="header.key"
      v-slot:[`header.${header.key}`]="{ column, toggleSort, isSorted, sortBy }"
    >
      <div class="header-content">
        <div class="title-container">
          <span>{{ column.title }}</span>
          <v-icon
            v-if="isSorted(column)"
            :icon="currentSortDirection(header.key) === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"
          />
          <v-icon class="custom-arrow-icon" v-else-if="header.sortable" icon="mdi-arrow-up" />
        </div>
        <v-menu
          v-model="menuStates[header.key]"
          location="end"
          :close-on-content-click="false"
          @update:modelValue="handleMenuOpen(header.key)"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-filter"
              variant="text"
              size="small"
              color="#7C7C7C"
              density="compact"
            ></v-btn>
          </template>

          <v-card min-width="300">
            <v-card-text>
              <component
                :is="getFilterComponent(header.key)"
                v-if="header.key in localFilters"
                v-model="localFilters[header.key]"
                :items="getFilterOptions(header.key)"
                :label="column.filterTitle.toLowerCase()"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-card-text>
            <v-card-actions>
              <v-btn @click="clearFilter(header.key)">Очистить</v-btn>
              <v-spacer />
              <v-btn color="primary" @click="applyFilter(header.key)"> Применить </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </div>
    </template>
    <template v-slot:item="{ item }">
      <tr
        :key="item.id"
        draggable="true"
        @dragstart="handleDragStart($event, item)"
        @dragend="handleDragEnd"
        style="cursor: grab"
      >
        <td>{{ item.id }}</td>
        <td>{{ item.title }}</td>
        <td>{{ item.assignee }}</td>
        <td>{{ item.status }}</td>
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
  <!-- Добавьте после таблицы -->
  <div v-if="dropZonesVisible" class="drop-zones">
    <div
      v-for="zone in dropZones"
      :key="zone.status"
      class="drop-zone"
      :class="[zone.key, { hovered: zone.hovered }]"
      @dragover.prevent="handleDragOver($event, zone)"
      @dragleave="handleDragLeave(zone)"
      @drop="handleDrop(zone.status)"
    >
      {{ zone.status }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useStore } from '@/store'
import type { DataTableHeaders, SortItem } from '@/types/common'
import type { Task } from '@/types/task'

const props = defineProps<{
  headers: DataTableHeaders[]
  tasks: Task[]
}>()

const emit = defineEmits(['edit', 'delete'])
const store = useStore()

const sortBy = ref<SortItem[]>([])
const columnWidths = ref<Record<string, number>>(initializeWidths())
const filterableHeaders = computed(() => {
  return props.headers.filter((header) => header.filterable)
})

const statusOptions = computed(() => store.state.statuses)

const appliedFilters = ref<Record<string, any>>({})

const localFilters = ref<Record<string, any>>({})

const menuStates = ref<Record<string, boolean>>({})

const currentSortDirection = (key: string): 'asc' | 'desc' | null => {
  const sortItem = sortBy.value.find((item) => item.key === key)
  return sortItem ? sortItem.order : null
}
const getFilterComponent = (key: string) => {
  switch (key) {
    case 'status':
      return 'v-select'
    default:
      return 'v-text-field'
  }
}

const handleMenuOpen = (key: string) => {
  if (!(key in localFilters.value)) {
    localFilters.value = {
      ...localFilters.value,
      [key]: '',
    }
  }
}

const getFilterOptions = (key: string) => {
  switch (key) {
    case 'status':
      return statusOptions.value
    default:
      return []
  }
}

const applyFilter = (key: string) => {
  appliedFilters.value = {
    ...appliedFilters.value,
    [key]: localFilters.value[key],
  }
  menuStates.value[key] = false
}

const clearFilter = (key: string) => {
  localFilters.value[key] = null
  appliedFilters.value[key] = null
}

const filteredTasks = computed(() => {
  return props.tasks.filter((task) => {
    return Object.entries(appliedFilters.value).every(([key, value]) => {
      if (value === null || value === '') return true
      switch (key) {
        case 'assignee':
          return task.assignee?.toLowerCase().includes(value.toLowerCase())
        case 'status':
          return task.status === value
        default:
          return String(task[key]) === String(value)
      }
    })
  })
})

let curCol: HTMLTableCellElement | undefined
let nxtCol: HTMLTableCellElement | undefined
let pageX: number | undefined
let curColWidth: number | undefined
let nxtColWidth: number | undefined
let mousemoveHandler: ((e: MouseEvent) => void) | null = null
let mouseupHandler: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

function initializeWidths(): Record<string, number> {
  const savedWidths = localStorage.getItem('columnWidths')
  if (savedWidths) {
    return JSON.parse(savedWidths)
  }
  const stateWidths = store.state.projects.columnWidths || {}
  if (Object.keys(stateWidths).length > 0) {
    return stateWidths
  }
  return Object.fromEntries(props.headers.map((header) => [header.key, header.width || 150]))
}

function saveColumnWidths() {
  localStorage.setItem('columnWidths', JSON.stringify(columnWidths.value))
  store.commit('projects/updateColumnWidths', { ...columnWidths.value })
}

function resizableGrid(table: HTMLElement) {
  const row = table.querySelector('tr') as HTMLTableRowElement | null
  const cols = row?.cells

  if (!cols || cols.length === 0) return

  table.style.overflow = 'hidden'

  function updateResizerHeight() {
    if (!cols) return
    const tableHeight = table.offsetHeight
    for (const cell of cols) {
      const resizer = cell.querySelector('.resizer') as HTMLDivElement | null
      if (resizer) resizer.style.height = `${tableHeight}px`
    }
  }

  for (const cell of cols) {
    const div = createDiv(table.offsetHeight)
    div.classList.add('resizer')
    cell.appendChild(div)
    cell.style.position = 'relative'
    setListeners(div)
  }

  resizeObserver = new ResizeObserver(updateResizerHeight)
  resizeObserver.observe(table)

  function setListeners(div: HTMLDivElement) {
    mousemoveHandler = (e: MouseEvent) => {
      if (!curCol) return

      const diffX = e.pageX - (pageX || 0)
      const newCurWidth = Math.max(50, (curColWidth || 0) + diffX)
      const newNxtWidth = nxtCol ? Math.max(50, (nxtColWidth || 0) - diffX) : undefined

      requestAnimationFrame(() => {
        curCol!.style.width = `${newCurWidth}px`
        if (nxtCol) {
          nxtCol.style.width = `${newNxtWidth}px`
        }
      })
    }

    mouseupHandler = () => {
      if (curCol && 'cellIndex' in curCol) {
        const newCurWidth = parseFloat(curCol.style.width || curColWidth?.toString() || '0')
        columnWidths.value[props.headers[curCol.cellIndex].key] = newCurWidth

        if (nxtCol && 'cellIndex' in nxtCol) {
          const newNxtWidth = parseFloat(nxtCol.style.width || nxtColWidth?.toString() || '0')
          columnWidths.value[props.headers[nxtCol.cellIndex].key] = newNxtWidth
        }
        saveColumnWidths()
      }

      curCol = nxtCol = undefined
      pageX = curColWidth = nxtColWidth = undefined
      document.removeEventListener('mousemove', mousemoveHandler!)
      document.removeEventListener('mouseup', mouseupHandler!)
    }

    div.addEventListener('mousedown', (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      const parentElement = target.parentElement
      if (!parentElement || !(parentElement instanceof HTMLTableCellElement)) return

      const currentCell = parentElement as HTMLTableCellElement
      let nextCell: HTMLTableCellElement | undefined

      const nextSibling = currentCell.nextElementSibling
      if (nextSibling instanceof HTMLTableCellElement) {
        nextCell = nextSibling
      }

      curCol = currentCell
      nxtCol = nextCell
      pageX = e.pageX

      const padding = paddingDiff(currentCell)
      curColWidth = currentCell.offsetWidth - padding
      if (nextCell) {
        nxtColWidth = nextCell.offsetWidth - padding
      }

      document.addEventListener('mousemove', mousemoveHandler!)
      document.addEventListener('mouseup', mouseupHandler!)
    })
  }

  function createDiv(height: number): HTMLDivElement {
    const div = document.createElement('div')
    div.style.top = '0'
    div.style.right = '0'
    div.style.width = '5px'
    div.style.position = 'absolute'
    div.style.cursor = 'col-resize'
    div.style.userSelect = 'none'
    div.style.height = `${height}px`
    div.style.borderRight = '2px solid transparent'
    return div
  }

  function paddingDiff(col: HTMLElement): number {
    if (getStyleVal(col, 'box-sizing') === 'border-box') return 0
    const padLeft = parseInt(getStyleVal(col, 'padding-left') || '0')
    const padRight = parseInt(getStyleVal(col, 'padding-right') || '0')
    return padLeft + padRight
  }

  function getStyleVal(elm: HTMLElement, css: string): string {
    return window.getComputedStyle(elm, null).getPropertyValue(css)
  }
}
const handleSortChange = (newSort: SortItem[]) => {
  store.dispatch('tasks/saveSorting', newSort)
}

onMounted(async () => {
  if (store.state.tasks.sorting.length) {
    sortBy.value = store.state.tasks.sorting
  } else {
    await store.dispatch('tasks/loadSorting')
    sortBy.value = store.state.tasks.sorting
  }
  if (Object.values(store.state.tasks.filters).length) {
    appliedFilters.value = store.state.tasks.filters
    localFilters.value = store.state.tasks.filters
  } else {
    await store.dispatch('tasks/loadFilters')
    appliedFilters.value = store.state.tasks.filters
    localFilters.value = store.state.tasks.filters
  }

  await nextTick()
  const table = document.querySelector('table')
  if (table) resizableGrid(table)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('mousemove', mousemoveHandler!)
  document.removeEventListener('mouseup', mouseupHandler!)
})

watch(
  appliedFilters,
  (newFilters) => {
    console.log('appliedFilters', newFilters)
    store.dispatch('tasks/saveFilters', newFilters)
  },
  { deep: true },
)

//drag
const draggedTask = ref<Task | null>(null)
const dropZonesVisible = ref<Boolean>(false)
const dropZones = ref([
  { status: 'To Do', hovered: false, key: 'toDo' },
  { status: 'In Progress', hovered: false, key: 'inProgress' },
  { status: 'Done', hovered: false, key: 'done' },
])

const handleDragStart = (event, task) => {
  draggedTask.value = task
  dropZonesVisible.value = true
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.dropEffect = 'move'
}

const handleDragEnd = () => {
  draggedTask.value = null
  dropZonesVisible.value = false
  dropZones.value.forEach((z) => (z.hovered = false))
}

const handleDragOver = (event, zone) => {
  event.preventDefault()
  zone.hovered = true
}
const handleDragLeave = (zone) => {
  zone.hovered = false
}

const handleDrop = (newStatus: string) => {
  if (draggedTask.value && typeof draggedTask.value === 'object') {
    store.dispatch('tasks/updateTask', {
      ...draggedTask.value,
      status: newStatus,
    })
  }
  handleDragEnd()
}
</script>

<style scoped>
.resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  z-index: 1;
}

.resizer:hover {
  background: #0000ff40;
}

.v-data-table > .v-table__wrapper > table {
  table-layout: fixed;
}
.header-content {
  display: flex;
  justify-content: space-between;
  &__column-title {
    flex: 1;
  }
}

.drop-zones {
  display: flex;
  pointer-events: none;
  gap: 16px;
  padding-top: 16px;
}

.drop-zone {
  padding: 8px;
  aspect-ratio: 1;
  background: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 4px;
  text-align: center;
  margin: 4px 0;
  pointer-events: auto;
  flex: 1;
  opacity: 0.5;
  transition: 0.1s ease-in;
  &.hovered {
    border-color: #2196f3;
    opacity: 1;
  }
  &.toDo {
    background-color: #b9f6ca;
  }
  &.inProgress {
    background-color: #ffff8d;
  }
  &.done {
    background-color: #ff8a80;
  }
}
</style>
