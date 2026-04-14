-- AlterTable: add custom practice rule fields to compliance_rules
ALTER TABLE "compliance_rules"
  ADD COLUMN IF NOT EXISTS "financialYear"    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "officialDueDate"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "internalDueDate"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "applicableTypes"  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "reminderDays"     INTEGER[]    NOT NULL DEFAULT ARRAY[30,7,1]::INTEGER[],
  ADD COLUMN IF NOT EXISTS "defaultNotes"     TEXT,
  ADD COLUMN IF NOT EXISTS "defaultPriority"  VARCHAR(20);
