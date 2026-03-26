/*
  Warnings:

  - You are about to drop the column `google_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `pan_masked` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `sub_type` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `user_type` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CA', 'CLIENT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('ITR', 'GST_RETURN', 'AUDIT', 'ADVANCE_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_review', 'approved', 'overdue');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('pending_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_CREATED', 'DOC_UPLOADED', 'DOC_APPROVED', 'DOC_REJECTED', 'MESSAGE_RECEIVED', 'DEADLINE_REMINDER');

-- DropIndex
DROP INDEX "users_google_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "google_id",
DROP COLUMN "pan_masked",
DROP COLUMN "sub_type",
DROP COLUMN "user_type",
ADD COLUMN     "caId" UUID,
ADD COLUMN     "firmId" UUID,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CLIENT';

-- DropEnum
DROP TYPE "SubType";

-- DropEnum
DROP TYPE "UserType";

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "pan" VARCHAR(10) NOT NULL,
    "phone" VARCHAR(20),
    "address" TEXT,
    "riskLevel" VARCHAR(20),
    "driveFolder" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_tasks" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "ruleId" UUID,
    "fy" VARCHAR(7) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMPTZ NOT NULL,
    "description" TEXT,
    "documentChecklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "compliance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_rules" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "dueDaysFromFYEnd" INTEGER NOT NULL,
    "documentChecklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "driveFileId" VARCHAR(255) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "documentType" VARCHAR(100) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'pending_review',
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" UUID,
    "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ,
    "reviewedBy" UUID,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "lastMessageAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" VARCHAR(80),
    "unreadCountCA" INTEGER NOT NULL DEFAULT 0,
    "unreadCountClient" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderRole" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentDocId" UUID,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "body" VARCHAR(200) NOT NULL,
    "refId" UUID,
    "refType" VARCHAR(20),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_userId_key" ON "client_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_caId_pan_key" ON "client_profiles"("caId", "pan");

-- CreateIndex
CREATE UNIQUE INDEX "documents_driveFileId_key" ON "documents"("driveFileId");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_caId_clientId_key" ON "message_threads"("caId", "clientId");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_caId_fkey" FOREIGN KEY ("caId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_caId_fkey" FOREIGN KEY ("caId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "compliance_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "compliance_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_caId_fkey" FOREIGN KEY ("caId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
