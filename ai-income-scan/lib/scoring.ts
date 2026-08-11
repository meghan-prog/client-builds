import { RouteId, routes } from "@/config/routes";
import { scoringMap, reasonsMap } from "@/config/scoring";

export type Answers = Record<string, string>; // questionId -> optionId

export interface ScanResult {
  scores: Record<RouteId, number>;
  matchPercentages: Record<RouteId, number>;
  primaryRoute: RouteId;
  secondaryRoute: RouteId;
  reasons: string[];
  rankedRoutes: RouteId[];
}

const routeIds = Object.keys(routes) as RouteId[];

function emptyRouteScores(): Record<RouteId, number> {
  return routeIds.reduce((acc, id) => {
    acc[id] = 0;
    return acc;
  }, {} as Record<RouteId, number>);
}

/** Per route: som van de best haalbare punten per vraag (voor % berekening). */
function computeMaxPossibleByRoute(): Record<RouteId, number> {
  const maxByRoute = emptyRouteScores();
  const byQuestion: Record<string, string[]> = {};

  for (const key of Object.keys(scoringMap)) {
    const questionId = key.split(".")[0];
    byQuestion[questionId] = byQuestion[questionId] || [];
    byQuestion[questionId].push(key);
  }

  for (const questionId of Object.keys(byQuestion)) {
    const keys = byQuestion[questionId];
    for (const routeId of routeIds) {
      let max = 0;
      for (const key of keys) {
        const points = scoringMap[key]?.[routeId] ?? 0;
        if (points > max) max = points;
      }
      maxByRoute[routeId] += max;
    }
  }

  return maxByRoute;
}

const maxPossibleByRoute = computeMaxPossibleByRoute();

export function computeResult(answers: Answers): ScanResult {
  const scores = emptyRouteScores();

  for (const [questionId, optionId] of Object.entries(answers)) {
    const key = `${questionId}.${optionId}`;
    const points = scoringMap[key];
    if (!points) continue;
    for (const routeId of Object.keys(points) as RouteId[]) {
      scores[routeId] += points[routeId] ?? 0;
    }
  }

  const ranked = [...routeIds].sort((a, b) => scores[b] - scores[a]);
  const primaryRoute = ranked[0];
  const secondaryRoute = ranked[1];

  const matchPercentages = routeIds.reduce((acc, id) => {
    const max = maxPossibleByRoute[id] || 1;
    acc[id] = Math.max(0, Math.min(100, Math.round((scores[id] / max) * 100)));
    return acc;
  }, {} as Record<RouteId, number>);

  const reasons = Object.entries(answers)
    .map(([questionId, optionId]) => {
      const key = `${questionId}.${optionId}`;
      const points = scoringMap[key]?.[primaryRoute] ?? 0;
      return { key, points };
    })
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
    .map((entry) => reasonsMap[entry.key])
    .filter(Boolean);

  return {
    scores,
    matchPercentages,
    primaryRoute,
    secondaryRoute,
    reasons,
    rankedRoutes: ranked,
  };
}
