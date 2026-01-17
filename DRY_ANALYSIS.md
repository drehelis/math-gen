# DRY Analysis Report: math-gen

This report identifies code duplication across the codebase with refactoring recommendations to apply the DRY (Don't Repeat Yourself) principle.

---

## 🔴 High Priority Duplications

### 1. localStorage Load/Save Pattern

**Files Affected:**
- [useSimpleQuestionGenerator.js](file:///workspaces/math-gen/src/composables/useSimpleQuestionGenerator.js#L9-L47)
- [useMissingQuestionGenerator.js](file:///workspaces/math-gen/src/composables/useMissingQuestionGenerator.js#L8-L46)
- [useComparisonQuestionGenerator.js](file:///workspaces/math-gen/src/composables/useComparisonQuestionGenerator.js#L9-L47)
- [useMultiplicationTableGenerator.js](file:///workspaces/math-gen/src/composables/useMultiplicationTableGenerator.js#L6-L44)

**Duplicated Code Pattern:**
```javascript
const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return null
}

const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}
```

**Lines Duplicated:** ~80 lines (20 lines × 4 files)

**Recommendation:** Create a shared `useLocalStorage` composable:
```javascript
// src/composables/useLocalStorage.js
export function useLocalStorage(key, defaultValue = null) {
  const load = () => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : defaultValue
    } catch { return defaultValue }
  }
  
  const save = (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }
  
  const remove = () => localStorage.removeItem(key)
  
  return { load, save, remove }
}
```

---

### 2. Card & Badge Styling Functions

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L428-L520)
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L463-L555)
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L326-L418)

**Duplicated Code:**
- `cardColors` array (identical across 3 files)
- `getCardStyle()` function (~40 lines × 3 = **120 lines**)
- `getBadgeStyle()` function (~40 lines × 3 = **120 lines**)

**Total Lines Duplicated:** ~240 lines

**Recommendation:** Create a shared composable:
```javascript
// src/composables/useQuestionCardStyles.js
export function useQuestionCardStyles(props, feedbackState, focusedIndex) {
  const cardColors = ['var(--color-sunshine)', 'var(--color-coral)', ...]
  
  const getCardStyle = (index) => { /* ... */ }
  const getBadgeStyle = (index) => { /* ... */ }
  
  return { cardColors, getCardStyle, getBadgeStyle }
}
```

---

### 3. Pagination Function

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L522-L534)
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L557-L569)
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L420-L432)

**Duplicated Code:**
```javascript
const paginateQuestions = (questions, itemsPerPage) => {
  const pages = []
  const questionsWithIndex = questions.map((question, index) => ({
    ...question,
    displayIndex: index + 1
  }))
  for (let i = 0; i < questionsWithIndex.length; i += itemsPerPage) {
    pages.push(questionsWithIndex.slice(i, i + itemsPerPage))
  }
  return pages
}
```

**Lines Duplicated:** ~15 lines × 3 = **45 lines**

**Recommendation:** Add to a shared utils file:
```javascript
// src/utils/pagination.js
export const paginateQuestions = (questions, itemsPerPage) => { /* ... */ }
```

---

## 🟠 Medium Priority Duplications

### 4. GitHub Footer Component

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L156-L174)
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L184-L202)
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L99-L117)
- [MultiplicationTableDisplay.vue](file:///workspaces/math-gen/src/components/MultiplicationTableDisplay.vue#L99-L117)

**Duplicated Code:** SVG icon + link to GitHub (~20 lines × 4 files)

**Lines Duplicated:** ~80 lines

**Recommendation:** Create `GitHubFooter.vue` component:
```vue
<!-- src/components/GitHubFooter.vue -->
<template>
  <div class="text-center py-8">
    <a href="https://github.com/drehelis/math-gen" ...>
      <svg ...></svg>
    </a>
  </div>
</template>
```

---

### 5. Empty State Template

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L318-L351)
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L374-L407)
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L190-L223)

**Duplicated Code:** Empty state with title, message, and GitHub link (~30 lines × 3 files)

**Lines Duplicated:** ~90 lines

**Recommendation:** Create `EmptyState.vue` component:
```vue
<!-- src/components/EmptyState.vue -->
<template>
  <div class="text-center py-20 no-print">
    <h3>{{ $t('emptyState.title') }}</h3>
    <p>{{ $t('emptyState.message') }}</p>
    <GitHubFooter />
  </div>
</template>
```

---

### 6. `getRandomNumber` Function Pattern

**Files Affected:**
- [useSimpleQuestionGenerator.js](file:///workspaces/math-gen/src/composables/useSimpleQuestionGenerator.js#L71-L120)
- [useMissingQuestionGenerator.js](file:///workspaces/math-gen/src/composables/useMissingQuestionGenerator.js#L84-L122)
- [useComparisonQuestionGenerator.js](file:///workspaces/math-gen/src/composables/useComparisonQuestionGenerator.js#L79-L100)

**Overlapping Logic:**
- Difficulty-based min/max ranges
- `Math.floor(Math.random() * (max - min + 1)) + min` pattern
- `varySecondNumber` logic

**Lines Duplicated:** ~100 lines across 3 files

**Recommendation:** Extract to utility:
```javascript
// src/utils/randomNumber.js
export const getDifficultyRange = (difficulty) => {
  const ranges = {
    easy: [0, 10], beginners: [0, 10], basic: [1, 20],
    medium: [10, 100], hard: [100, 900]
  }
  return ranges[difficulty] || [0, 10]
}

export const getRandomInRange = (min, max) => 
  Math.floor(Math.random() * (max - min + 1)) + min
```
---

### 7. Print Styles (CSS)

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L539-L660) - 121 lines
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L572-L624) - 52 lines
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L435-L483) - 48 lines

**Shared CSS Classes:**
- `.print-horizontal-grid`
- `.print-horizontal-item`
- `.equation-number`
- `.equation .number`, `.equation .operator`, `.equation .equals`
- `.equation .answer-blank`

**Lines Duplicated:** ~100 lines

**Recommendation:** Move shared print styles to global CSS:
```css
/* src/style.css or src/print.css */
@media print {
  .print-horizontal-grid { /* ... */ }
  .print-horizontal-item { /* ... */ }
  .equation { /* ... */ }
  /* ... */
}
```

---

## 🟡 Lower Priority Duplications

### 8. Question Watch & Lifecycle Pattern

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L402-L426)
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L437-L461)
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L292-L324)

**Duplicated Pattern:**
```javascript
onMounted(() => {
  if (props.questions.length > 0 && !props.showAnswers) {
    focusFirstInput(props.questions)
  }
})

watch(() => props.questions, (newQuestions, oldQuestions) => {
  if (newQuestions.length > 0 && !props.showAnswers) {
    if (!oldQuestions || newQuestions.length !== oldQuestions.length || 
        newQuestions[0]?.id !== oldQuestions[0]?.id) {
      clearAllFeedback()
      showCompletionOverlay.value = false
    }
    focusFirstInput(newQuestions)
  }
})

watch(correctCount, (newCount) => {
  if (newCount === props.questions.length && props.questions.length > 0) {
    completionStats.value = getCompletionStats(props.questions.length)
    setTimeout(() => { showCompletionOverlay.value = true }, 500)
  }
})
```

**Lines Duplicated:** ~30 lines × 3 = **90 lines**

**Recommendation:** Create a shared composable:
```javascript
// src/composables/useQuestionLifecycle.js
export function useQuestionLifecycle(props, feedbackUtils) {
  // Encapsulate onMounted, watch patterns
}
```

---

### 9. Completion Overlay Integration

**Files Affected:**
- All 4 display components

**Pattern:**
```javascript
const showCompletionOverlay = ref(false)
const completionStats = ref({ total: 0, firstTry: 0, timeInSeconds: 0, accuracy: 100 })
```

**Recommendation:** Could be managed by `useQuestionFeedback` composable directly.

---

### 10. Question Card Template Structure

**Files Affected:**
- [QuestionDisplay.vue](file:///workspaces/math-gen/src/components/QuestionDisplay.vue#L14-L27)
- [MissingQuestionDisplay.vue](file:///workspaces/math-gen/src/components/MissingQuestionDisplay.vue#L14-L26)
- [ComparisonQuestionDisplay.vue](file:///workspaces/math-gen/src/components/ComparisonQuestionDisplay.vue#L14-L26)

**Duplicated Template:**
```vue
<div class="question-card relative rounded-2xl p-3 sm:p-4 border-4 cursor-pointer"
     :style="getCardStyle(index)">
  <!-- Badge -->
  <div class="absolute -top-3 -left-3 w-10 h-10 rounded-full ...">
    {{ index + 1 }}
  </div>
  <!-- Feedback indicator -->
  <div v-if="!showAnswers && feedbackState[question.id]?.show" ...>
    {{ feedbackState[question.id]?.isCorrect ? '✓' : '✗' }}
  </div>
  <!-- Content slot -->
</div>
```

**Recommendation:** Create a `QuestionCard.vue` wrapper component with slots.

---

## 📊 Summary

| Priority | Pattern | Files | Lines Saved |
|----------|---------|-------|-------------|
| 🔴 High | localStorage pattern | 4 | ~60 |
| 🔴 High | Card/Badge styling | 3 | ~200 |
| 🔴 High | Pagination function | 3 | ~30 |
| 🟠 Medium | GitHub footer | 4 | ~60 |
| 🟠 Medium | Empty state | 3 | ~60 |
| 🟠 Medium | getRandomNumber | 3 | ~70 |
| 🟠 Medium | Print CSS | 3 | ~80 |
| 🟡 Low | Lifecycle watchers | 3 | ~60 |
| 🟡 Low | Completion overlay | 4 | ~20 |
| 🟡 Low | Question card template | 3 | ~40 |

**Estimated Total Lines Savable: ~680 lines** (out of ~5,000 lines analyzed)

---

## Suggested Refactoring Order

1. **Create `useLocalStorage.js`** — Highest impact, straightforward
2. **Create `useQuestionCardStyles.js`** — Significant deduplication
3. **Create `GitHubFooter.vue` and `EmptyState.vue`** — Easy wins
4. **Extract print styles to global CSS** — Clean separation
5. **Create shared random number utilities** — Medium complexity
6. **Create `QuestionCard.vue` wrapper** — Larger refactor
