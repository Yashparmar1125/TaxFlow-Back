/*
  Warnings:

  - A unique constraint covering the columns `[membership_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "firmId" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" VARCHAR(255),
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "experience_years" INTEGER,
ADD COLUMN     "membership_id" VARCHAR(50),
ADD COLUMN     "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "firms" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "registration_number" VARCHAR(50),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_membership_id_key" ON "users"("membership_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
