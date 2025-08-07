-- AlterTable
ALTER TABLE "public"."articles" ALTER COLUMN "figureCount" SET DEFAULT 0;
ALTER TABLE "public"."articles" ALTER COLUMN "tableCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."publications" ALTER COLUMN "metadata" SET DEFAULT '{}';

-- CreateTable
CREATE TABLE "public"."authors" (
    "id" STRING NOT NULL,
    "firstName" STRING NOT NULL,
    "lastName" STRING NOT NULL,
    "email" STRING NOT NULL,
    "affiliation" STRING NOT NULL,
    "orcid" STRING,
    "biography" STRING,
    "photoUrl" STRING,
    "isActive" BOOL NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CoAuthors" (
    "A" STRING NOT NULL,
    "B" STRING NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "authors_email_key" ON "public"."authors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "authors_orcid_key" ON "public"."authors"("orcid");

-- CreateIndex
CREATE UNIQUE INDEX "_CoAuthors_AB_unique" ON "public"."_CoAuthors"("A", "B");

-- CreateIndex
CREATE INDEX "_CoAuthors_B_index" ON "public"."_CoAuthors"("B");

-- AddForeignKey
ALTER TABLE "public"."publications" ADD CONSTRAINT "publications_primaryAuthorId_fkey" FOREIGN KEY ("primaryAuthorId") REFERENCES "public"."authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CoAuthors" ADD CONSTRAINT "_CoAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CoAuthors" ADD CONSTRAINT "_CoAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
