<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="w-full px-4 py-3 font-semibold rounded-2xl border-2 focus:outline-none transition-all flex items-center justify-between"
      :class="isOpen ? 'scale-105' : 'hover:scale-105'"
      :style="buttonStyle"
      @click="toggleDropdown"
    >
      <span>{{ selectedLabel }}</span>
      <span
        class="text-xl transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
        >▼</span
      >
    </button>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-2 rounded-2xl border-2 shadow-2xl overflow-hidden"
        :style="dropdownStyle"
      >
        <template v-for="(option, index) in options" :key="option.value">
          <!-- Parent option with children -->
          <div v-if="option.children">
            <!-- ... existing div ... -->
            <div
              class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105 flex items-center justify-between"
              :class="[
                { 'opacity-50': modelValue === option.value },
                isRTL ? 'hover:-translate-x-1' : 'hover:translate-x-1',
              ]"
              :style="optionStyle"
              @click="toggleParent(option.value)"
            >
              <span>{{ option.label }}</span>
              <span
                class="text-sm transition-transform duration-200"
                :class="{
                  [isRTL ? '-rotate-90' : 'rotate-90']:
                    expandedParents[option.value],
                }"
                >{{ isRTL ? "◀" : "▶" }}</span
              >
            </div>
            <!-- Nested children with slide animation -->
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div
                v-if="expandedParents[option.value]"
                class="overflow-hidden relative"
              >
                <!-- Indent Line -->
                <div
                  class="absolute top-0 bottom-6 w-1 rounded-full opacity-25"
                  :class="isRTL ? 'right-6' : 'left-6'"
                  :style="{ backgroundColor: props.textColor }"
                />
                <div
                  v-for="(child, childIndex) in option.children"
                  :key="child.value"
                >
                  <div
                    class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105 relative flex items-center"
                    :class="[
                      { 'opacity-50': modelValue === child.value },
                      isRTL
                        ? 'pr-14 hover:-translate-x-1'
                        : 'pl-14 hover:translate-x-1',
                    ]"
                    :style="{
                      ...optionStyle,
                      opacity: modelValue === child.value ? '0.5' : '0.9',
                    }"
                    @click="selectOption(child)"
                  >
                    <!-- Horizontal Tick -->
                    <div
                      class="absolute top-1/2 -translate-y-1/2 w-6 h-1 rounded-full opacity-25"
                      :class="isRTL ? 'right-6' : 'left-6'"
                      :style="{ backgroundColor: props.textColor }"
                    />
                    {{ child.label }}
                  </div>
                  <!-- Child Separator -->
                  <div
                    v-if="childIndex < option.children.length - 1"
                    class="h-px opacity-5 mx-8 rounded-full"
                    :class="isRTL ? 'mr-14' : 'ml-14'"
                    :style="{ backgroundColor: textColor }"
                  />
                </div>
              </div>
            </transition>
          </div>
          <!-- Regular option without children -->
          <div
            v-else
            class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105"
            :class="[
              { 'opacity-50': modelValue === option.value },
              isRTL ? 'hover:-translate-x-1' : 'hover:translate-x-1',
            ]"
            :style="optionStyle"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </div>

          <!-- Main Separator -->
          <div
            v-if="index < options.length - 1"
            class="h-0.5 opacity-10 mx-4 rounded-full"
            :style="{ backgroundColor: textColor }"
          />
        </template>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from "vue";
import { useI18n } from "vue-i18n";

interface Option {
  value: string | number;
  label: string;
  children?: Option[];
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: Option[];
    borderColor?: string;
    backgroundColor?: string;
    textColor?: string;
  }>(),
  {
    borderColor: "var(--color-sunshine)",
    backgroundColor: "var(--color-sunshine)",
    textColor: "var(--color-deep)",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();

const { locale } = useI18n();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const expandedParents = reactive<Record<string, boolean>>({});

const isRTL = computed(() => {
  return locale.value === "he" || document.documentElement.dir === "rtl";
});

const selectedLabel = computed(() => {
  if (!props.options) return "";
  const option = props.options.find((opt) => opt.value === props.modelValue);
  if (option) return option.label;

  for (const parent of props.options) {
    if (parent.children) {
      const child = parent.children.find((c) => c.value === props.modelValue);
      if (child) return child.label;
    }
  }

  return "";
});

const buttonStyle = computed(() => ({
  borderColor: props.borderColor,
  background: props.backgroundColor,
  color: props.textColor,
}));

const dropdownStyle = computed(() => ({
  borderColor: props.borderColor,
  background: props.backgroundColor,
}));

const optionStyle = computed(() => ({
  color: props.textColor,
}));

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const toggleParent = (parentValue: string | number) => {
  expandedParents[String(parentValue)] = !expandedParents[String(parentValue)];
};

const selectOption = (option: Option) => {
  emit("update:modelValue", option.value);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
