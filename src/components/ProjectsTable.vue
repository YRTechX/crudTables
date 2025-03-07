<template>
  <div class="table-wrapper">
    <v-data-table
      :headers="headers"
      :items="filteredProjects"
      :items-per-page="10"
      class="elevation-1 custom-header"
      v-model:sort-by="sortBy"
      @update:sort-by="handleSortChange"
    >
      <!-- Фильтруемые заголовки -->
      <template
        v-for="header in filterableHeaders"
        :key="header.key"
        v-slot:[`header.${header.key}`]="{ column }"
      >
        <div class="header-content">
          <span class="header-content__column-title">{{ column.title }}</span>
          <v-menu v-model="menuStates[header.key]" location="end" :close-on-content-click="false">
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
                <!-- Фильтр по имени -->
                <v-text-field
                  v-if="header.key === 'name'"
                  v-model="nameFilter"
                  label="Пошук за назвою"
                  variant="outlined"
                  clearable
                  @input="applyFilters"
                  density="compact"
                ></v-text-field>

                <!-- Фильтр по статусу -->
                <v-select
                  v-if="header.key === 'status'"
                  v-model="statusFilter"
                  :items="statusOptions"
                  label="Фiльтр по статусу"
                  variant="outlined"
                  clearable
                  @update:model-value="applyFilters"
                  density="compact"
                ></v-select>
              </v-card-text>
              <v-card-actions>
                <v-btn size="small" variant="text" @click="clearFilters(header.key)"
                  >Очистить</v-btn
                >
                <v-spacer></v-spacer>
                <v-btn
                  class="blue-btn"
                  size="small"
                  variant="text"
                  @click="menuStates[header.key] = false"
                >
                  Применить
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </div>
      </template>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import type { Project } from '@/types/project'
import type { DataTableHeaders, SortItem } from '@/types/common'

const props = defineProps<{
  headers: DataTableHeaders[]
  projects: Project[]
}>()

const emit = defineEmits(['edit', 'delete'])

const router = useRouter()
const store = useStore()
const sortBy = ref<SortItem[]>([])
const columnWidths = ref<Record<string, number>>(initializeWidths())
const filterableHeaders = computed(() => {
  return props.headers.filter((header) => header.filterable)
})
const menuStates = reactive(
  Object.fromEntries(filterableHeaders.value.map((header) => [header.key, false])),
)

// Переменные для фильтрации
const nameFilter = ref<string>('')
const statusFilter = ref<string | null>(null)

const statusOptions = computed(() => store.state.statuses)

// Вычисляемое свойство для фильтрации проектов
const filteredProjects = computed(() => {
  let filtered = [...props.projects]

  // Фильтрация по имени (name)
  if (nameFilter.value) {
    const searchTerm = nameFilter.value.toLowerCase().trim()
    filtered = filtered.filter((project) => project.name.toLowerCase().includes(searchTerm))
  }

  // Фильтрация по статусу (status)
  if (statusFilter.value) {
    filtered = filtered.filter((project) => project.status === statusFilter.value)
  }

  return filtered
})

// Применение фильтров (можно оставить пустым, так как computed автоматически обновляет данные)
function applyFilters() {
  // Здесь можно добавить дополнительные действия, если нужно, например, сохранить фильтры в стейт
}

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

onMounted(async () => {
  if (store.state.projects.sorting.length) {
    sortBy.value = store.state.projects.sorting
  } else {
    await store.dispatch('projects/loadSorting')
    sortBy.value = store.state.projects.sorting
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

const handleSortChange = (newSort: SortItem[]) => {
  store.dispatch('projects/saveSorting', newSort)
}

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}
</script>

<style scoped>
.table-wrapper {
  position: relative;
  overflow-x: auto;
}

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

.filter-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 4px;
}

.filter-input {
  max-width: 150px;
}

.filter-select {
  max-width: 150px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  &__column-title {
    flex: 1;
  }
}
</style>
