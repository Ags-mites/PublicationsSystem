-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth_schema";

-- CreateEnum
CREATE TYPE "auth_schema"."UserRole" AS ENUM ('ROLE_AUTHOR', 'ROLE_REVIEWER', 'ROLE_EDITOR', 'ROLE_ADMIN', 'ROLE_READER');

-- CreateTable
CREATE TABLE "auth_schema"."users" (
    "id" UUID NOT NULL,
    "first_name" STRING(100) NOT NULL,
    "last_name" STRING(100) NOT NULL,
    "email" STRING(255) NOT NULL,
    "password" STRING(255) NOT NULL,
    "roles" "auth_schema"."UserRole"[],
    "affiliation" STRING(500),
    "orcid" STRING(19),
    "biography" STRING(2000),
    "profile_image_url" STRING(500),
    "is_active" BOOL NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_schema"."refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" STRING(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_revoked" BOOL NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth_schema"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "auth_schema"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "auth_schema"."refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "auth_schema"."refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "auth_schema"."refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "auth_schema"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
