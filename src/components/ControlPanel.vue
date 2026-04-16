<script setup lang="ts">
import { reactive, watch, computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import CustomDropdown from "./CustomDropdown.vue";
import MultiSelectDropdown from "./MultiSelectDropdown.vue";

interface Settings {
  count: number | string;
  operations: string[];
  difficulty: string;
  varySecondNumber: boolean;
  showAnswers: boolean;
  showGuide: boolean;
  inputMode: string;
  questionFormat: string;
  missingPosition: string;
  prefillPercentage: number;
  tableSize: number;
  selectedOptions?: (string | number)[];
}

const props = defineProps<{
  settings: Settings;
  hasQuestions?: boolean;
  showControls?: boolean;
  hideOperation?: boolean;
  comparisonMode?: boolean;
  tableMode?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:settings", value: Settings): void;
  (e: "generate"): void;
  (e: "print"): void;
}>();

const { locale, t } = useI18n();
const currentLocale = computed(() => locale.value);

interface LocalSettings {
  count: number | string;
  difficulty: string;
  operations: string[];
  missingPosition: string;
  prefillPercentage: number;
  tableSize: number;
  selectedOptions: (string | number)[];
  varySecondNumber: boolean;
  showAnswers: boolean;
  showGuide: boolean;
  inputMode: string;
  questionFormat: string;
  [key: string]: unknown;
}

const localSettings = reactive<LocalSettings>({
  ...props.settings,
  operations: props.settings.operations || ["addition"],
  varySecondNumber: props.settings.varySecondNumber || false,
  showAnswers: props.settings.showAnswers || false,
  showGuide: props.settings.showGuide || false,
  inputMode: props.settings.inputMode || "native",
  questionFormat: props.settings.questionFormat || "standard",
  missingPosition: props.settings.missingPosition || "random",
  prefillPercentage: props.settings.prefillPercentage || 0,
  tableSize: props.settings.tableSize || 10,
  selectedOptions: props.settings.selectedOptions || [],
});

const isCollapsed = ref(props.hasQuestions);
const showCustomCount = ref(false);
const customCountValue = ref<number | null>(null);

// Auto-expand menu when there are no questions
watch(
  () => props.hasQuestions,
  (has) => {
    if (!has) isCollapsed.value = false;
  },
);

// Update settings when props change
watch(
  () => props.hideOperation,
  (isHidden) => {
    if (isHidden) {
      const validOps = localSettings.operations.filter(
        (op) => op === "addition" || op === "subtraction",
      );
      localSettings.operations = validOps.length > 0 ? validOps : ["addition"];
    }
  },
  { immediate: true },
);

watch(
  () => props.comparisonMode,
  (isComp) => {
    if (!isComp) {
      if (localSettings.operations.includes("none")) {
        localSettings.operations = ["addition"];
      }
      return;
    }

    if (localSettings.difficulty === "hard") {
      localSettings.difficulty = "medium";
    }

    const isBasicOrMed = ["basic", "medium"].includes(localSettings.difficulty);
    if (isBasicOrMed) {
      const hasAddSub = localSettings.operations.some((op) =>
        ["addition", "subtraction"].includes(op),
      );
      if (!hasAddSub) localSettings.operations = ["addition"];
    } else if (!localSettings.operations.includes("none")) {
      localSettings.operations = ["none"];
    }
  },
  { immediate: true },
);

watch(
  () => localSettings.difficulty,
  (newDiff) => {
    if (!props.comparisonMode) return;

    if (["beginners", "easy"].includes(newDiff)) {
      localSettings.operations = ["none"];
    } else if (
      ["basic", "medium"].includes(newDiff) &&
      localSettings.operations.includes("none")
    ) {
      localSettings.operations = ["addition"];
    }
  },
);

// Sync local settings to parent
watch(
  localSettings,
  (newValue) => {
    emit("update:settings", newValue);
  },
  { deep: true },
);

// Universal regenerator for settings changes
const settingsToWatch = [
  () => localSettings.count,
  () => localSettings.operations,
  () => localSettings.difficulty,
  () => localSettings.varySecondNumber,
  () => localSettings.questionFormat,
  () => localSettings.missingPosition,
  () => localSettings.prefillPercentage,
  () => localSettings.tableSize,
];

settingsToWatch.forEach((source) => {
  watch(
    source,
    () => {
      if (props.tableMode || props.hasQuestions) {
        emit("generate");
      }
    },
    { deep: true },
  );
});

const handleGenerate = () => emit("generate");
const handlePrint = () => window.print();

const handleCustomCountBlur = () => {
  const val = Number(customCountValue.value);
  const isValid = val && val >= 1 && val <= 500;
  localSettings.count = isValid ? val : 20;
  showCustomCount.value = false;
};

const countOptions = computed(() => {
  const base: { value: string | number; label: string }[] = [
    10, 20, 30, 50,
  ].map((v) => ({ value: v, label: t(`questions.count.${v}`) }));
  if (
    typeof localSettings.count === "number" &&
    ![10, 20, 30, 50].includes(localSettings.count)
  ) {
    base.push({
      value: localSettings.count,
      label: `${localSettings.count} ${t("questions.count.10").includes("Questions") ? "Questions" : "תרגילים"}`,
    });
  }
  base.push({ value: "custom", label: t("questions.count.custom") });
  return base;
});

watch(
  () => localSettings.count,
  (nv) => {
    if (nv === "custom") {
      showCustomCount.value = true;
      customCountValue.value = null;
    }
  },
);

const operationOptions = computed(() => [
  { value: "addition", label: t("operation.addition") },
  { value: "subtraction", label: t("operation.subtraction") },
  { value: "multiplication", label: t("operation.multiplication") },
  { value: "division", label: t("operation.division") },
]);

const comparisonOperationOptions = computed(() => {
  if (["basic", "medium"].includes(localSettings.difficulty)) {
    return operationOptions.value;
  }
  return [{ value: "none", label: t("controls.none") }];
});

const tableSizeOptions = computed(() =>
  [10, 12, 15].map((v) => ({ value: v, label: t(`table.size.${v}`) })),
);
const prefillOptions = computed(() =>
  [0, 25, 45, 75].map((v) => ({ value: v, label: t(`table.prefill.${v}`) })),
);

const difficultyOptions = computed(() => {
  const options = [
    {
      value: "easy",
      label: t("difficulty.easy"),
      children: [
        { value: "beginners", label: t("difficulty.beginners") },
        { value: "basic", label: t("difficulty.basic") },
        { value: "tens", label: t("difficulty.tens") },
      ],
    },
    { value: "medium", label: t("difficulty.medium") },
  ];
  if (!props.comparisonMode)
    options.push({ value: "hard", label: t("difficulty.hard") });
  return options;
});

const optionsOptions = computed(() => {
  const options = [{ value: "showAnswers", label: t("controls.showAnswers") }];
  if (props.tableMode) return options;

  if (!props.hideOperation && !props.comparisonMode) {
    const canShowGuide =
      localSettings.operations.length === 1 &&
      ["addition", "subtraction"].includes(localSettings.operations[0]) &&
      ["beginners", "easy"].includes(localSettings.difficulty);

    if (canShowGuide)
      options.push({ value: "showGuide", label: t("controls.showGuide") });

    if (["medium", "hard"].includes(localSettings.difficulty)) {
      options.push({
        value: "varySecondNumber",
        label: t("controls.varySecondNumber"),
      });
      if (localSettings.operations.some((op) => op !== "multiplication")) {
        options.push({
          value: "columnByColumn",
          label: t("controls.columnByColumn"),
        });
      }
    }
  }

  if (props.hideOperation) {
    if (["medium", "hard"].includes(localSettings.difficulty)) {
      options.push({
        value: "varySecondNumber",
        label: t("controls.varySecondNumber"),
      });
    }
    if (!["beginners", "basic"].includes(localSettings.difficulty)) {
      options.push({
        value: "bothSides",
        label: t("questionFormat.bothSides"),
      });
    }
  }
  return options;
});

const syncSelectedOptions = () => {
  const selected: string[] = [];
  if (localSettings.showAnswers) selected.push("showAnswers");
  if (localSettings.showGuide) selected.push("showGuide");

  if (["medium", "hard"].includes(localSettings.difficulty)) {
    if (localSettings.varySecondNumber) selected.push("varySecondNumber");
    if (
      !props.hideOperation &&
      localSettings.inputMode === "column-by-column"
    ) {
      selected.push("columnByColumn");
    }
  }

  if (
    props.hideOperation &&
    localSettings.questionFormat === "both-sides-mixed"
  ) {
    selected.push("bothSides");
  }

  localSettings.selectedOptions = selected;
};

syncSelectedOptions();

watch(
  () => localSettings.selectedOptions,
  (newOptions) => {
    if (!newOptions) return;
    localSettings.showAnswers = newOptions.includes("showAnswers");
    localSettings.showGuide = newOptions.includes("showGuide");
    localSettings.varySecondNumber = newOptions.includes("varySecondNumber");
    localSettings.inputMode = newOptions.includes("columnByColumn")
      ? "column-by-column"
      : "native";

    if (props.hideOperation) {
      localSettings.questionFormat = newOptions.includes("bothSides")
        ? "both-sides-mixed"
        : "standard";
    }
  },
  { deep: true },
);

// Filter out options that are no longer available when context changes
watch(
  [
    () => localSettings.difficulty,
    () => props.hideOperation,
    () => props.tableMode,
    () => localSettings.operations,
  ],
  () => {
    const available = optionsOptions.value.map((opt) => opt.value);
    if (localSettings.selectedOptions) {
      localSettings.selectedOptions = localSettings.selectedOptions.filter(
        (opt) => (available as (string | number)[]).includes(opt),
      );
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="no-print relative mb-12">
    <div
      class="rounded-3xl shadow-2xl relative transition-all duration-300 md:bg-white md:p-8 md:border-8"
      :class="{
        'bg-transparent p-0 shadow-none border-0': isCollapsed,
        'bg-white p-8 border-8': !isCollapsed,
      }"
      :style="'border-color: var(--color-deep);'"
    >
      <!-- Mobile: Collapse badge on bottom border -->
      <button
        class="md:hidden absolute left-1/2 -translate-x-1/2 -bottom-5 z-20 px-4 py-1 rounded-full border-4 transition-all shadow-lg"
        style="
          background: var(--color-deep);
          border-color: var(--color-deep);
          color: white;
        "
        @click="isCollapsed = !isCollapsed"
      >
        <svg
          class="w-5 h-5 transition-transform duration-300"
          :class="{ 'rotate-180': !isCollapsed }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Collapsible content wrapper for mobile -->
      <div
        class="transition-all duration-300 ease-in-out md:!max-h-none md:!opacity-100 md:!overflow-visible"
        :class="{
          'max-h-0 opacity-0 overflow-hidden': isCollapsed,
          'max-h-[2000px] opacity-100 overflow-visible': !isCollapsed,
        }"
      >
        <div class="relative text-center mb-8">
          <div
            class="mb-4 lg:mb-0 lg:absolute lg:top-0 flex justify-center"
            :style="{
              [currentLocale === 'he' ? 'right' : 'left']:
                currentLocale === 'he' ? '0' : '0',
            }"
          >
            <slot name="language-switcher" />
          </div>

          <h1
            class="text-5xl md:text-6xl font-bold mb-2"
            style="color: var(--color-deep); letter-spacing: -0.02em"
          >
            {{ $t("app.title") }}
          </h1>
          <div
            class="flex items-center justify-center gap-3 text-4xl font-bold"
          >
            <span class="animate-pulse" style="color: var(--color-orange)"
              >+</span
            >
            <span
              class="animate-pulse"
              style="color: var(--color-coral); animation-delay: 0.2s"
              >-</span
            >
            <span
              class="animate-pulse"
              style="color: var(--color-sky); animation-delay: 0.4s"
              >×</span
            >
            <span
              class="animate-pulse"
              style="color: var(--color-mint); animation-delay: 0.6s"
              >÷</span
            >
          </div>
        </div>

        <slot name="tabs" />

        <div
          v-if="showControls"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div v-if="!tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="
                color: var(--color-deep);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              "
            >
              {{ $t("controls.howMany") }}
            </label>
            <CustomDropdown
              v-if="!showCustomCount"
              v-model="localSettings.count"
              :options="countOptions"
              border-color="var(--color-sunshine)"
              background-color="var(--color-sunshine)"
              text-color="var(--color-deep)"
            />
            <div v-else class="relative flex items-center">
              <button
                class="absolute left-2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 shadow-sm"
                style="
                  color: var(--color-deep);
                  background: white;
                  border-color: var(--color-sunshine);
                "
                @click="
                  customCountValue = Math.max(1, (customCountValue || 20) - 1)
                "
              >
                <span class="text-2xl font-bold leading-none select-none"
                  >−</span
                >
              </button>
              <input
                ref="customCountInput"
                v-model.number="customCountValue"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                min="1"
                max="500"
                autofocus
                class="w-full px-14 py-3 font-semibold rounded-2xl border-2 focus:outline-none transition-all text-center no-spinner"
                style="
                  border-color: var(--color-sunshine);
                  background: var(--color-sunshine);
                  color: var(--color-deep);
                "
                :placeholder="$t('controls.enterNumber')"
                @blur="handleCustomCountBlur"
                @keyup.enter="handleCustomCountBlur"
              />
              <button
                class="absolute right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 shadow-sm"
                style="
                  color: var(--color-deep);
                  background: white;
                  border-color: var(--color-sunshine);
                "
                @click="
                  customCountValue = Math.min(500, (customCountValue || 20) + 1)
                "
              >
                <span class="text-2xl font-bold leading-none select-none"
                  >+</span
                >
              </button>
            </div>
          </div>

          <div v-if="tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="
                color: var(--color-deep);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              "
            >
              {{ $t("table.tableSize") }}
            </label>
            <CustomDropdown
              v-model="localSettings.tableSize"
              :options="tableSizeOptions"
              border-color="var(--color-sunshine)"
              background-color="var(--color-sunshine)"
              text-color="var(--color-deep)"
            />
          </div>

          <div v-if="tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="
                color: var(--color-deep);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              "
            >
              {{ $t("table.prefillPercentage") }}
            </label>
            <CustomDropdown
              v-model="localSettings.prefillPercentage"
              :options="prefillOptions"
              border-color="var(--color-sky)"
              background-color="var(--color-sky)"
              text-color="white"
            />
          </div>

          <div v-if="!tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="
                color: var(--color-deep);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              "
            >
              {{ $t("controls.operation") }}
            </label>
            <MultiSelectDropdown
              v-model="localSettings.operations"
              :options="
                comparisonMode
                  ? comparisonOperationOptions
                  : hideOperation
                    ? [
                        {
                          value: 'addition',
                          label: $t('missingOperation.addition'),
                        },
                        {
                          value: 'subtraction',
                          label: $t('missingOperation.subtraction'),
                        },
                      ]
                    : operationOptions
              "
              border-color="var(--color-sky)"
              background-color="var(--color-sky)"
              text-color="white"
            />
          </div>

          <div v-if="!tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="
                color: var(--color-deep);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              "
            >
              {{ $t("controls.difficulty") }}
            </label>
            <CustomDropdown
              v-model="localSettings.difficulty"
              :options="difficultyOptions"
              border-color="var(--color-coral)"
              background-color="var(--color-coral)"
              text-color="white"
            />
          </div>

          <div>
            <label
              class="block text-sm font-bold mb-3"
              style="
                color: var(--color-deep);
                text-transform: uppercase;
                letter-spacing: 0.05em;
              "
            >
              {{ $t("controls.options") }}
            </label>
            <MultiSelectDropdown
              v-model="localSettings.selectedOptions"
              :options="optionsOptions"
              border-color="var(--color-mint)"
              background-color="var(--color-mint)"
              text-color="white"
              :allow-empty="true"
            />
          </div>
        </div>

        <div v-if="showControls" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            :disabled="tableMode && localSettings.prefillPercentage === 0"
            class="py-5 px-8 font-bold text-xl rounded-2xl border-4 transition-all transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
            :style="
              tableMode && localSettings.prefillPercentage === 0
                ? 'background: #ccc; border-color: #999; color: #666;'
                : 'background: var(--color-sky); border-color: var(--color-deep); color: white;'
            "
            @click="handleGenerate"
          >
            {{
              tableMode
                ? $t("controls.prefillTable")
                : $t("controls.generateQuestions")
            }}
          </button>

          <button
            :disabled="!hasQuestions"
            class="py-5 px-8 font-bold text-xl rounded-2xl border-4 transition-all transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
            :style="
              hasQuestions
                ? 'background: var(--color-purple); border-color: var(--color-deep); color: white;'
                : 'background: #ccc; border-color: #999; color: #666;'
            "
            @click="handlePrint"
          >
            {{ $t("controls.printMe") }}
          </button>
        </div>
      </div>
      <!-- End Collapsible content wrapper -->
    </div>

    <div
      class="absolute -top-4 -right-4 w-24 h-24 rounded-full -z-10"
      style="background: var(--color-sunshine)"
    />
    <div
      class="absolute -bottom-4 -left-4 w-20 h-20 rotate-45 -z-10"
      style="background: var(--color-coral)"
    />
  </div>
</template>

<style scoped>
/* Remove number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

.no-spinner {
  -webkit-appearance: none;
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
