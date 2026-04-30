-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "marketingMarkdown" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Plan" ADD COLUMN "marketingFeatures" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Plan" ADD COLUMN "isBestseller" BOOLEAN NOT NULL DEFAULT false;
