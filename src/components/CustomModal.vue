<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500px"
    @update:model-value="emit('update:modelValue', $event)"
    :persistent="persistent"
  >
    <v-card>
      <v-card-title>
        <slot name="title"></slot>
      </v-card-title>
      <v-card-text>
        <slot name="content"></slot>
      </v-card-text>
      <v-card-actions>
        <slot name="actions"></slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults } from 'vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    persistent?: boolean
  }>(),
  {
    persistent: false,
  },
)

const emit = defineEmits(['update:modelValue'])
</script>
