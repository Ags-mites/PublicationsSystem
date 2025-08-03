import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting notifications database seeding...');

    // Create notification templates
    const templates = [
        {
            eventType: 'USER_REGISTERED',
            channel: 'EMAIL',
            subject: 'Welcome to Academic Publishing System',
            bodyTemplate: 'Welcome {{firstName}} {{lastName}}! Your account has been successfully created. You can now access the academic publishing system.',
        },
        {
            eventType: 'USER_LOGIN',
            channel: 'WEBSOCKET',
            subject: 'Login Notification',
            bodyTemplate: 'User {{email}} has logged in at {{timestamp}}.',
        },
        {
            eventType: 'PUBLICATION_SUBMITTED',
            channel: 'EMAIL',
            subject: 'Publication Submitted Successfully',
            bodyTemplate: 'Your publication "{{title}}" has been submitted for review. You will receive updates on its status.',
        },
        {
            eventType: 'PUBLICATION_APPROVED',
            channel: 'EMAIL',
            subject: 'Publication Approved',
            bodyTemplate: 'Congratulations! Your publication "{{title}}" has been approved and will be published soon.',
        },
        {
            eventType: 'REVIEW_REQUESTED',
            channel: 'EMAIL',
            subject: 'Review Request',
            bodyTemplate: 'You have been assigned to review the publication "{{title}}". Please complete your review within the specified timeframe.',
        },
        {
            eventType: 'REVIEW_COMPLETED',
            channel: 'EMAIL',
            subject: 'Review Completed',
            bodyTemplate: 'The review for your publication "{{title}}" has been completed. Status: {{status}}.',
        },
    ];

    for (const template of templates) {
        const existing = await prisma.notificationTemplate.findUnique({
            where: {
                eventType_channel: {
                    eventType: template.eventType,
                    channel: template.channel as any,
                },
            },
        });

        if (!existing) {
            await prisma.notificationTemplate.create({
                data: template as any,
            });
            console.log(`✅ Created template: ${template.eventType} - ${template.channel}`);
        } else {
            console.log(`⚠️  Template already exists: ${template.eventType} - ${template.channel}`);
        }
    }

    // Create notification preferences for test users
    const userIds = [
        '11111111-1111-1111-1111-111111111111', // admin
        '22222222-2222-2222-2222-222222222222', // editor
        '33333333-3333-3333-3333-333333333333', // author
        '44444444-4444-4444-4444-444444444444', // reviewer
        '55555555-5555-5555-5555-555555555555', // reader
    ];

    for (const userId of userIds) {
        const existing = await prisma.notificationPreference.findUnique({
            where: { userId },
        });

        if (!existing) {
            await prisma.notificationPreference.create({
                data: {
                    userId,
                    emailEnabled: true,
                    websocketEnabled: true,
                    pushEnabled: false,
                    emailDigestEnabled: true,
                    digestFrequency: 'daily',
                    quietHoursStart: '22:00',
                    quietHoursEnd: '08:00',
                    timezone: 'UTC-5',
                },
            });
            console.log(`✅ Created preferences for user: ${userId}`);
        } else {
            console.log(`⚠️  Preferences already exist for user: ${userId}`);
        }
    }

    // Create sample notifications
    const sampleNotifications = [
        {
            userId: '33333333-3333-3333-3333-333333333333',
            type: 'PUBLICATION_SUBMITTED',
            title: 'Publication Submitted',
            message: 'Your publication "Microservices Architecture in Modern Applications" has been submitted successfully.',
            channel: 'EMAIL',
            status: 'SENT',
            metadata: {
                publicationId: '44444444-4444-4444-4444-444444444444',
                publicationTitle: 'Microservices Architecture in Modern Applications',
            },
            sentAt: new Date('2024-01-10'),
        },
        {
            userId: '44444444-4444-4444-4444-444444444444',
            type: 'REVIEW_REQUESTED',
            title: 'Review Assignment',
            message: 'You have been assigned to review "Database Design Patterns for Distributed Systems".',
            channel: 'EMAIL',
            status: 'SENT',
            metadata: {
                publicationId: '55555555-5555-5555-5555-555555555555',
                publicationTitle: 'Database Design Patterns for Distributed Systems',
                deadline: '2024-01-25',
            },
            sentAt: new Date('2024-01-12'),
        },
        {
            userId: '33333333-3333-3333-3333-333333333333',
            type: 'PUBLICATION_APPROVED',
            title: 'Publication Approved',
            message: 'Congratulations! Your publication has been approved for publication.',
            channel: 'EMAIL',
            status: 'SENT',
            metadata: {
                publicationId: '44444444-4444-4444-4444-444444444444',
                approvalDate: '2024-01-15',
            },
            sentAt: new Date('2024-01-15'),
        },
    ];

    for (const notif of sampleNotifications) {
        const existing = await prisma.notification.findFirst({
            where: {
                userId: notif.userId,
                type: notif.type as any,
                title: notif.title,
            },
        });

        if (!existing) {
            await prisma.notification.create({
                data: notif as any,
            });
            console.log(`✅ Created notification: ${notif.title}`);
        } else {
            console.log(`⚠️  Notification already exists: ${notif.title}`);
        }
    }

    // Create subscriptions for users
    const subscriptions = [
        {
            userId: '33333333-3333-3333-3333-333333333333',
            eventType: 'PUBLICATION_SUBMITTED',
            channelPreference: 'EMAIL',
        },
        {
            userId: '33333333-3333-3333-3333-333333333333',
            eventType: 'PUBLICATION_APPROVED',
            channelPreference: 'EMAIL',
        },
        {
            userId: '44444444-4444-4444-4444-444444444444',
            eventType: 'REVIEW_REQUESTED',
            channelPreference: 'EMAIL',
        },
        {
            userId: '22222222-2222-2222-2222-222222222222',
            eventType: 'PUBLICATION_SUBMITTED',
            channelPreference: 'EMAIL',
        },
    ];

    for (const sub of subscriptions) {
        const existing = await prisma.notificationSubscription.findUnique({
            where: {
                userId_eventType: {
                    userId: sub.userId,
                    eventType: sub.eventType,
                },
            },
        });

        if (!existing) {
            await prisma.notificationSubscription.create({
                data: sub as any,
            });
            console.log(`✅ Created subscription: ${sub.eventType} for ${sub.userId}`);
        } else {
            console.log(`⚠️  Subscription already exists: ${sub.eventType} for ${sub.userId}`);
        }
    }

    console.log('🎉 Notifications database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });