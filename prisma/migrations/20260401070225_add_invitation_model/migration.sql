-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "stakeholderType" VARCHAR(50),
    "caId" UUID NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_code_key" ON "invitations"("code");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_caId_fkey" FOREIGN KEY ("caId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
