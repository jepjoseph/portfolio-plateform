function createPortfolioStorageKey(username, portfolioSlug) {
  return `public-portfolio:${username}:${portfolioSlug}`;
}

export async function savePortfolio(portfolio) {
  if (!portfolio?.username || !portfolio?.slug) {
    throw new Error("The portfolio username and slug are required.");
  }

  const portfolioToSave = {
    ...portfolio,
    isPublished: true,
    updatedAt: new Date().toISOString(),
  };

  const storageKey = createPortfolioStorageKey(
    portfolio.username,
    portfolio.slug,
  );

  localStorage.setItem(storageKey, JSON.stringify(portfolioToSave));

  return portfolioToSave;
}

export async function getPublicPortfolio(username, portfolioSlug) {
  const storageKey = createPortfolioStorageKey(username, portfolioSlug);

  const storedPortfolio = localStorage.getItem(storageKey);

  if (!storedPortfolio) {
    throw new Error("Portfolio not found.");
  }

  return JSON.parse(storedPortfolio);
}
