-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('USER_LOGIN', 'USER_REGISTERED', 'PUBLICATION_SUBMITTED', 'PUBLICATION_APPROVED', 'PUBLICATION_PUBLISHED', 'REVIEW_REQUESTED', 'REVIEW_COMPLETED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WEBSOCKET', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" STRING NOT NULL,
    "message" STRING NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "retry_count" INT4 NOT NULL DEFAULT 0,
    "max_retries" INT4 NOT NULL DEFAULT 3,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_type" STRING NOT NULL,
    "channel_preference" "NotificationChannel" NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_type" STRING NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" STRING NOT NULL,
    "body_template" STRING NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email_enabled" BOOL NOT NULL DEFAULT true,
    "websocket_enabled" BOOL NOT NULL DEFAULT true,
    "push_enabled" BOOL NOT NULL DEFAULT false,
    "email_digest_enabled" BOOL NOT NULL DEFAULT false,
    "digest_frequency" STRING NOT NULL DEFAULT 'daily',
    "quiet_hours_start" STRING,
    "quiet_hours_end" STRING,
    "timezone" STRING NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "priority" INT4 NOT NULL DEFAULT 1,
    "scheduled_for" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" STRING,
    "retry_count" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" STRING NOT NULL,
    "response" JSONB,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "error_code" STRING,
    "error_message" STRING,

    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_subscriptions_user_id_idx" ON "notification_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "notification_subscriptions_event_type_idx" ON "notification_subscriptions"("event_type");

-- CreateIndex
CREATE INDEX "notification_subscriptions_is_active_idx" ON "notification_subscriptions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_subscriptions_user_id_event_type_key" ON "notification_subscriptions"("user_id", "event_type");

-- CreateIndex
CREATE INDEX "notification_templates_event_type_idx" ON "notification_templates"("event_type");

-- CreateIndex
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates"("channel");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_type_channel_key" ON "notification_templates"("event_type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_queue_scheduled_for_idx" ON "notification_queue"("scheduled_for");

-- CreateIndex
CREATE INDEX "notification_queue_processed_at_idx" ON "notification_queue"("processed_at");

-- CreateIndex
CREATE INDEX "notification_queue_priority_scheduled_for_idx" ON "notification_queue"("priority", "scheduled_for");

-- CreateIndex
CREATE INDEX "notification_queue_channel_idx" ON "notification_queue"("channel");

-- CreateIndex
CREATE INDEX "delivery_logs_notification_id_idx" ON "delivery_logs"("notification_id");

-- CreateIndex
CREATE INDEX "delivery_logs_channel_idx" ON "delivery_logs"("channel");

-- CreateIndex
CREATE INDEX "delivery_logs_status_idx" ON "delivery_logs"("status");

-- CreateIndex
CREATE INDEX "delivery_logs_attempted_at_idx" ON "delivery_logs"("attempted_at");

-- AddForeignKey
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
