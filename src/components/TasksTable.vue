<template>
  <v-data-table
    :headers="headers"
    :items="tasks"
    :items-per-page="10"
    class="elevation-1 custom-header"
    v-model:sort-by="sortBy"
    @update:sort-by="handleSortChange"
  >
    <template v-slot:item="{ item }">
      <tr style="cursor: pointer">
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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
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
  store.dispatch('projects/saveSorting', newSort)
}
onMounted(async () => {
  if (store.state.projects.sorting.length) {
    sortBy.value = store.state.projects.sorting
  } else {
    await store.dispatch('tasks/loadSorting')
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
</style>
