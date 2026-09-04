import "server-only";

import { cache } from "react";
import {
  resolveDashboardNextAction,
  type DashboardViewModel,
} from "@/lib/dashboard/dashboard-view-model";
import { getWeakSkills } from "@/server/learning/analytics.service";
import { getDashboardSnapshot } from "@/server/learning/daily-learning.service";

async function loadDashboardViewModel(userId: string): Promise<DashboardViewModel> {
  const snapshot = await getDashboardSnapshot(userId);
  const weaknesses = await getWeakSkills(
    userId,
    snapshot.learnerGoal.currentLevel,
    1,
  );

  const nextAction = resolveDashboardNextAction({
    learnerLevel: snapshot.learnerGoal.currentLevel,
    dueReviews: snapshot.dueReviews,
    weaknesses,
    continueLearning: snapshot.continueLearning,
  });

  return { snapshot, nextAction };
}

export const buildDashboardViewModel = cache(loadDashboardViewModel);
