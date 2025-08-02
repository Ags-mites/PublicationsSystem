-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "catalog_publications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "original_id" UUID NOT NULL,
    "title" STRING NOT NULL,
    "abstract" STRING NOT NULL,
    "keywords" STRING[],
    "type" STRING NOT NULL,
    "primary_author" STRING NOT NULL,
    "co_authors" STRING[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "published_at" TIMESTAMP(3) NOT NULL,
    "isbn" STRING,
    "doi" STRING,
    "category" STRING NOT NULL,
    "license" STRING NOT NULL DEFAULT 'All Rights Reserved',
    "download_url" STRING,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "view_count" INT4 NOT NULL DEFAULT 0,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_authors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "original_id" UUID NOT NULL,
    "full_name" STRING NOT NULL,
    "affiliation" STRING NOT NULL,
    "orcid" STRING,
    "publication_count" INT4 NOT NULL DEFAULT 0,
    "last_published_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_statistics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query" STRING NOT NULL,
    "result_count" INT4 NOT NULL,
    "execution_time_ms" INT4 NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_publications_original_id_key" ON "catalog_publications"("original_id");

-- CreateIndex
CREATE INDEX "catalog_publications_title_idx" ON "catalog_publications"("title");

-- CreateIndex
CREATE INDEX "catalog_publications_keywords_idx" ON "catalog_publications"("keywords");

-- CreateIndex
CREATE INDEX "catalog_publications_category_idx" ON "catalog_publications"("category");

-- CreateIndex
CREATE INDEX "catalog_publications_published_at_idx" ON "catalog_publications"("published_at");

-- CreateIndex
CREATE INDEX "catalog_publications_type_idx" ON "catalog_publications"("type");

-- CreateIndex
CREATE INDEX "catalog_publications_primary_author_idx" ON "catalog_publications"("primary_author");

-- CreateIndex
CREATE INDEX "catalog_publications_status_idx" ON "catalog_publications"("status");

-- CreateIndex
CREATE INDEX "catalog_publications_view_count_idx" ON "catalog_publications"("view_count");

-- CreateIndex
CREATE INDEX "catalog_publications_title_keywords_idx" ON "catalog_publications"("title", "keywords");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_authors_original_id_key" ON "catalog_authors"("original_id");

-- CreateIndex
CREATE INDEX "catalog_authors_full_name_idx" ON "catalog_authors"("full_name");

-- CreateIndex
CREATE INDEX "catalog_authors_affiliation_idx" ON "catalog_authors"("affiliation");

-- CreateIndex
CREATE INDEX "catalog_authors_publication_count_idx" ON "catalog_authors"("publication_count");

-- CreateIndex
CREATE INDEX "search_statistics_timestamp_idx" ON "search_statistics"("timestamp");

-- CreateIndex
CREATE INDEX "search_statistics_query_idx" ON "search_statistics"("query");
