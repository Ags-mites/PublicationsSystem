-- CreateEnum
CREATE TYPE "public"."PublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "public"."PublicationType" AS ENUM ('ARTICLE', 'BOOK');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RETURNED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."OutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ChangeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "public"."publications" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "abstract" STRING NOT NULL,
    "keywords" STRING[],
    "status" "public"."PublicationStatus" NOT NULL,
    "currentVersion" INT4 NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "primaryAuthorId" STRING NOT NULL,
    "coAuthorIds" STRING[],
    "type" "public"."PublicationType" NOT NULL,
    "metadata" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" STRING NOT NULL,
    "publicationId" STRING NOT NULL,
    "targetJournal" STRING NOT NULL,
    "section" STRING NOT NULL,
    "bibliographicReferences" STRING[],
    "figureCount" INT4 NOT NULL,
    "tableCount" INT4 NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" STRING NOT NULL,
    "publicationId" STRING NOT NULL,
    "isbn" STRING NOT NULL,
    "pageCount" INT4 NOT NULL,
    "edition" STRING NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chapters" (
    "id" STRING NOT NULL,
    "bookId" STRING NOT NULL,
    "chapterNumber" INT4 NOT NULL,
    "title" STRING NOT NULL,
    "abstract" STRING NOT NULL,
    "pageStart" INT4 NOT NULL,
    "pageEnd" INT4 NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" STRING NOT NULL,
    "publicationId" STRING NOT NULL,
    "reviewerId" STRING NOT NULL,
    "reviewStatus" "public"."ReviewStatus" NOT NULL,
    "comments" STRING NOT NULL,
    "score" INT4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."change_requests" (
    "id" STRING NOT NULL,
    "reviewId" STRING NOT NULL,
    "section" STRING NOT NULL,
    "severity" "public"."ChangeSeverity" NOT NULL,
    "description" STRING NOT NULL,
    "suggestion" STRING,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outbox_events" (
    "id" STRING NOT NULL,
    "aggregateId" STRING NOT NULL,
    "aggregateType" STRING NOT NULL,
    "eventType" STRING NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "public"."OutboxStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "retryCount" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_publicationId_key" ON "public"."articles"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "books_publicationId_key" ON "public"."books"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "public"."books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_bookId_chapterNumber_key" ON "public"."chapters"("bookId", "chapterNumber");

-- CreateIndex
CREATE INDEX "outbox_events_status_createdAt_idx" ON "public"."outbox_events"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."books" ADD CONSTRAINT "books_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chapters" ADD CONSTRAINT "chapters_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "public"."publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."change_requests" ADD CONSTRAINT "change_requests_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
