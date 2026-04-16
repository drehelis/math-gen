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
          <div
            class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105 ltr:hover:translate-x-1 rtl:hover:-translate-x-1 flex items-center gap-3"
            :style="optionStyle"
            @click="toggleOption(option)"
          >
            <div
              class="w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
              :style="{
                borderColor: textColor,
                backgroundColor: 'transparent',
              }"
            >
              <div
                v-if="isSelected(option.value)"
                class="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-full"
                :style="{ backgroundColor: textColor }"
              />
            </div>
            <span>{{ option.label }}</span>
          </div>

          <!-- Separator -->
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Option {
  value: string | number;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: (string | number)[];
    options: Option[];
    borderColor?: string;
    backgroundColor?: string;
    textColor?: string;
    allowEmpty?: boolean;
  }>(),
  {
    borderColor: "var(--color-sunshine)",
    backgroundColor: "var(--color-sunshine)",
    textColor: "var(--color-deep)",
    allowEmpty: false,
  },
);

const emit = defineEmits<{
  (_e: "update:modelValue", _value: (string | number)[]): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => {
  if (props.modelValue.length === 0) {
    return t("controls.none");
  }
  if (
    props.modelValue.length === props.options.length &&
    props.options.length > 3
  ) {
    return t("missingOperation.all");
  }
  const selectedOptions = props.options.filter((opt) =>
    props.modelValue.includes(opt.value),
  );
  return selectedOptions.map((opt) => opt.label).join(", ");
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

const isSelected = (value: string | number) => {
  return props.modelValue.includes(value);
};

const toggleOption = (option: Option) => {
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(option.value);

  if (index > -1) {
    if (props.allowEmpty || newValue.length > 1) {
      newValue.splice(index, 1);
    }
  } else {
    newValue.push(option.value);
  }

  emit("update:modelValue", newValue);
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
