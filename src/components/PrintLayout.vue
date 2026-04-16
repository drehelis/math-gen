<template>
  <div class="hidden print:block">
    <div
      v-for="(page, pageIndex) in paginatedItems"
      :key="`${pageKeyPrefix}-${pageIndex}`"
      :class="{ 'print:break-before-page': pageIndex > 0 || forcePageBreak }"
    >
      <div class="print:mb-4">
        <h2 class="text-xl font-bold" style="color: black">
          <slot name="title" :page-index="pageIndex">
            {{ title }}
          </slot>
        </h2>
      </div>
      <div
        class="print:grid print:auto-flow-column"
        :class="[gapClass, columnsClass]"
        :style="getPageGridStyle(page.length)"
        dir="ltr"
      >
        <slot v-for="item in page" :key="item.id" name="item" :item="item" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Item {
  id: string;
  [key: string]: unknown;
}

const props = withDefaults(
  defineProps<{
    items: Item[];
    title?: string;
    itemsPerPage?: number;
    pageKeyPrefix?: string;
    gapClass?: string;
    columnsClass?: string;
    forcePageBreak?: boolean;
  }>(),
  {
    title: "",
    itemsPerPage: 30,
    pageKeyPrefix: "page",
    gapClass: "print:gap-4",
    columnsClass: "print:grid-cols-2",
    forcePageBreak: false,
  },
);

const paginateItems = (items: Item[]) => {
  const pages: Item[][] = [];
  const itemsWithIndex = items.map((item, index) => ({
    ...item,
    displayIndex: index + 1,
  }));

  for (let i = 0; i < itemsWithIndex.length; i += props.itemsPerPage) {
    pages.push(itemsWithIndex.slice(i, i + props.itemsPerPage));
  }

  return pages;
};

const paginatedItems = computed(() => paginateItems(props.items));

const getPageGridStyle = (itemCount: number) => {
  // Extract the number of columns from columnsClass (e.g., "print:grid-cols-4" -> 4)
  const colsMatch = props.columnsClass.match(/grid-cols-(\d+)/);
  const numCols = colsMatch ? parseInt(colsMatch[1]) : 2;
  const rowCount = Math.ceil(itemCount / numCols);
  return {
    "grid-template-rows": `repeat(${rowCount}, auto)`,
  };
};
</script>

<style scoped>
@media print {
  .print\:auto-flow-column {
    grid-auto-flow: column;
  }
}
</style>
