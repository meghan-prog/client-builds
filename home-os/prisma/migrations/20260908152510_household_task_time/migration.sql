-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HouseholdTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🧺',
    "category" TEXT NOT NULL DEFAULT 'household',
    "daysOfWeek" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL DEFAULT '18:30',
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "assignedChildId" TEXT,
    "assignedParentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HouseholdTask_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HouseholdTask" ("assignedChildId", "assignedParentId", "category", "createdAt", "daysOfWeek", "durationMinutes", "familyId", "icon", "id", "isRequired", "title") SELECT "assignedChildId", "assignedParentId", "category", "createdAt", "daysOfWeek", "durationMinutes", "familyId", "icon", "id", "isRequired", "title" FROM "HouseholdTask";
DROP TABLE "HouseholdTask";
ALTER TABLE "new_HouseholdTask" RENAME TO "HouseholdTask";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
