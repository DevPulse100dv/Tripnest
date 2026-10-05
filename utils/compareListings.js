const weightByPriority = Object.freeze({
  low: 1,
  medium: 2,
  high: 3,
});

const normalizePreferences = (preferences = {}) => {
  const criteria = ["price", "rating"];
  const normalized = {};

  for (const criterion of criteria) {
    const value = preferences[criterion];
    if (typeof value !== "string" || !Object.hasOwn(weightByPriority, value)) {
      throw new Error(`Choose Low, Medium, or High for ${criterion}.`);
    }
    normalized[criterion] = value;
  }

  return normalized;
};

const scoreCriterion = (values, higherIsBetter) => {
  const available = values
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => Number.isFinite(value) && value > 0);
  const scores = new Map();

  if (available.length === 1) {
    scores.set(available[0].index, 1);
    return scores;
  }

  const numbers = available.map(({ value }) => value);
  const minimum = Math.min(...numbers);
  const maximum = Math.max(...numbers);
  for (const { value, index } of available) {
    const score = maximum === minimum
      ? 1
      : higherIsBetter
        ? (value - minimum) / (maximum - minimum)
        : (maximum - value) / (maximum - minimum);
    scores.set(index, score);
  }
  return scores;
};

const calculateScores = (listings, preferences) => {
  const weights = Object.fromEntries(
    Object.entries(preferences).map(([criterion, priority]) => [criterion, weightByPriority[priority]])
  );
  const priceScores = scoreCriterion(listings.map((listing) => listing.price), false);
  const ratingScores = scoreCriterion(listings.map((listing) => listing.rating), true);

  return listings.map((listing, index) => {
    const contributions = [
      [priceScores.get(index), weights.price],
      [ratingScores.get(index), weights.rating],
    ].filter(([score]) => score !== undefined);
    const totalWeight = contributions.reduce((total, [, weight]) => total + weight, 0);
    const matchScore = totalWeight
      ? Math.round(contributions.reduce((total, [score, weight]) => total + score * weight, 0) / totalWeight * 100)
      : null;

    return { ...listing, matchScore };
  });
};

module.exports = { calculateScores, normalizePreferences };
