<template>
  <div class="hidden print:block">
    <div
      v-for="(page, pageIndex) in paginatedItems"
      :key="`${pageKeyPrefix}-${pageIndex}`"
      :class="{ 'print:break-before-page': pageIndex > 0 }"
    >
      <div class="print:mb-4">
        <h2 class="text-xl font-bold" style="color: black;">
          <slot name="title" :page-index="pageIndex">{{ title }}</slot>
        </h2>
      </div>
      <div
        class="print:grid print:grid-cols-2 print:auto-flow-column"
        :class="gapClass"
        :style="getPageGridStyle(page.length)"
        dir="ltr"
      >
        <slot name="item" v-for="item in page" :item="item" :key="item.id"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  itemsPerPage: {
    type: Number,
    default: 30
  },
  pageKeyPrefix: {
    type: String,
    default: 'page'
  },
  gapClass: {
    type: String,
    default: 'print:gap-4'
  }
})

const paginateItems = (items) => {
  const pages = []
  const itemsWithIndex = items.map((item, index) => ({
    ...item,
    displayIndex: index + 1
  }))

  for (let i = 0; i < itemsWithIndex.length; i += props.itemsPerPage) {
    pages.push(itemsWithIndex.slice(i, i + props.itemsPerPage))
  }

  return pages
}

const paginatedItems = computed(() => paginateItems(props.items))

const getPageGridStyle = (itemCount) => {
  const rowCount = Math.ceil(itemCount / 2)
  return {
    'grid-template-rows': `repeat(${rowCount}, auto)`
  }
}
</script>

<style scoped>
@media print {
  .print\:auto-flow-column {
    grid-auto-flow: column;
  }
}
</style>
