-- DropForeignKey
ALTER TABLE "client_profiles" DROP CONSTRAINT "client_profiles_caId_fkey";

-- AlterTable
ALTER TABLE "client_profiles" ADD COLUMN     "businessName" VARCHAR(100),
ADD COLUMN     "companyName" VARCHAR(100),
ADD COLUMN     "gstin" VARCHAR(15),
ADD COLUMN     "investmentFocus" VARCHAR(100),
ADD COLUMN     "personalization" JSONB DEFAULT '{}',
ADD COLUMN     "specialization" VARCHAR(100),
ADD COLUMN     "stakeholderType" VARCHAR(50),
ALTER COLUMN "caId" DROP NOT NULL,
ALTER COLUMN "pan" DROP NOT NULL,
ALTER COLUMN "driveFolder" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_onboarded" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_caId_fkey" FOREIGN KEY ("caId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
