export const PORTFOLIO_STYLE_OPTIONS = [
  {
    value: "professional",
    label: "Professional Portfolio",
    description: "Polished, formal, and focused on professional value.",
  },

  {
    value: "modern",
    label: "Modern Portfolio",
    description: "Contemporary, engaging, and conversational.",
  },

  {
    value: "technical",
    label: "Technical Portfolio",
    description: "Focused on technical capabilities, systems, and projects.",
  },

  {
    value: "academic",
    label: "Academic Portfolio",
    description: "Focused on education, research, training, and academic work.",
  },
];

export function normalizePortfolioStyle(value) {
  const styleExists = PORTFOLIO_STYLE_OPTIONS.some(
    (option) => option.value === value,
  );

  return styleExists ? value : "professional";
}

export function getPortfolioStyleOption(value) {
  const normalizedStyle = normalizePortfolioStyle(value);

  return (
    PORTFOLIO_STYLE_OPTIONS.find(
      (option) => option.value === normalizedStyle,
    ) || PORTFOLIO_STYLE_OPTIONS[0]
  );
}
