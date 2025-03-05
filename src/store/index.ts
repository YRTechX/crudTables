import { createStore, useStore as baseUseStore } from 'vuex'
import type { Store } from 'vuex/types/index.js'
import type { InjectionKey } from 'vue'
import projects from './projects'
import tasks from './tasks'
import type { RootState } from '@/types/common'

export const key: InjectionKey<Store<RootState>> = Symbol()

export const store = createStore<RootState>({
  modules: {
    projects,
    tasks,
  },
})

export function useStore() {
  return baseUseStore(key)
}
