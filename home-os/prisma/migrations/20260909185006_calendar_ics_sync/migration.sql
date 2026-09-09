-- AlterTable
ALTER TABLE "Calendar" ADD COLUMN "icsFeedUrl" TEXT;
ALTER TABLE "Calendar" ADD COLUMN "lastSyncedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calendarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "overrulesRoutine" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalUid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CalendarEvent" ("calendarId", "createdAt", "date", "endTime", "id", "notes", "overrulesRoutine", "startTime", "title", "type") SELECT "calendarId", "createdAt", "date", "endTime", "id", "notes", "overrulesRoutine", "startTime", "title", "type" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE UNIQUE INDEX "CalendarEvent_calendarId_externalUid_key" ON "CalendarEvent"("calendarId", "externalUid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
