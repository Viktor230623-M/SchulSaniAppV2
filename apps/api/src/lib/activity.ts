import { db } from "@workspace/db";
import { activityLogTable } from "@workspace/db";
import { logger } from "./logger";

export const ActivityAction = {
  DUTY_SLOT_CREATED: "duty.slot_created",
  DUTY_SLOT_DELETED: "duty.slot_deleted",
  DUTY_ENTERED:      "duty.entered",
  DUTY_CONFIRMED:    "duty.confirmed",
  MISSION_CREATED:   "mission.created",
  MISSION_RESPONDED: "mission.responded",
  MISSION_CLOSED:    "mission.closed",
  LOA_REQUESTED:     "loa.requested",
  LOA_APPROVED:      "loa.approved",
  LOA_REJECTED:      "loa.rejected",
} as const;

export type ActivityActionType = typeof ActivityAction[keyof typeof ActivityAction];

export function logActivity(
  userId: string | null,
  action: ActivityActionType | string,
  metadata?: Record<string, unknown>,
): void {
  db.insert(activityLogTable)
    .values({ userId, action, metadata: metadata ?? null })
    .catch((err) => logger.error({ err }, 'activity log write failed'));
}
