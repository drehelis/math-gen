export function useStyles(props, feedbackState, focusedIndex) {
  const CARD_COLORS = [
    "var(--color-sunshine)",
    "var(--color-coral)",
    "var(--color-mint)",
    "var(--color-sky)",
  ];
  const BADGE_COLORS = [
    "var(--color-orange)",
    "var(--color-purple)",
    "var(--color-sky)",
    "var(--color-mint)",
  ];

  const getCardStyle = (index) => {
    const color = CARD_COLORS[index % CARD_COLORS.length];
    const feedback = feedbackState.value[props.questions[index]?.id];
    const isCorrect = feedback?.isCorrect;
    const isFocused = index === focusedIndex.value;

    if (isCorrect && !props.showAnswers)
      return {
        background: "#d1fae5",
        borderColor: "var(--color-deep)",
        opacity: "0.7",
      };
    if (isFocused && !props.showAnswers)
      return {
        background: color,
        borderColor: "var(--color-deep)",
        transform: "scale(1.02)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      };
    if (!isCorrect && !isFocused && !props.showAnswers)
      return {
        background: color,
        borderColor: "var(--color-deep)",
        opacity: "0.4",
      };
    return { background: color, borderColor: "var(--color-deep)" };
  };

  const getBadgeStyle = (index) => {
    const bg = BADGE_COLORS[index % BADGE_COLORS.length];
    const feedback = feedbackState.value[props.questions[index]?.id];
    const isCorrect = feedback?.isCorrect;
    const isFocused = index === focusedIndex.value;

    if (isCorrect && !props.showAnswers)
      return {
        background: "#10b981",
        borderColor: "var(--color-deep)",
        color: "white",
      };
    return {
      background: bg,
      borderColor: "var(--color-deep)",
      color: "white",
      filter:
        !isCorrect && !isFocused && !props.showAnswers
          ? "brightness(0.7)"
          : "none",
    };
  };

  const paginateQuestions = (questions, size) => {
    const pages = [];
    for (let i = 0; i < questions.length; i += size) {
      pages.push(
        questions
          .slice(i, i + size)
          .map((q, idx) => ({ ...q, displayIndex: i + idx + 1 })),
      );
    }
    return pages;
  };

  return { getCardStyle, getBadgeStyle, paginateQuestions };
}
