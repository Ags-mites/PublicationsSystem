import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting catalog database seeding...');

    // Create catalog authors
    const catalogAuthors = [
        {
            originalId: '11111111-1111-1111-1111-111111111111',
            fullName: 'John Author',
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
            orcid: '0000-0001-2345-6789',
            publicationCount: 5,
            lastPublishedAt: new Date('2024-01-15'),
        },
        {
            originalId: '22222222-2222-2222-2222-222222222222',
            fullName: 'Jane Reviewer',
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
            orcid: '0000-0002-3456-7890',
            publicationCount: 8,
            lastPublishedAt: new Date('2024-12-01'),
        },
        {
            originalId: '33333333-3333-3333-3333-333333333333',
            fullName: 'Bob Smith',
            affiliation: 'MIT',
            orcid: '0000-0003-4567-8901',
            publicationCount: 12,
            lastPublishedAt: new Date('2024-11-20'),
        },
    ];

    for (const authorData of catalogAuthors) {
        const existingAuthor = await prisma.catalogAuthor.findUnique({
            where: { originalId: authorData.originalId },
        });

        if (!existingAuthor) {
            await prisma.catalogAuthor.create({
                data: authorData,
            });
                    console.log(`Created catalog author: ${authorData.fullName}`);
      } else {
        console.log(`Catalog author already exists: ${authorData.fullName}`);
        }
    }

    // Create catalog publications
    const catalogPublications = [
        {
            originalId: '44444444-4444-4444-4444-444444444444',
            title: 'Microservices Architecture in Modern Applications',
            abstract: 'This paper explores the implementation of microservices architecture patterns and their benefits in modern cloud-native applications.',
            keywords: ['microservices', 'architecture', 'cloud', 'scalability'],
            type: 'ARTICLE',
            primaryAuthor: 'John Author',
            coAuthors: ['Jane Reviewer'],
            metadata: {
                journal: 'Journal of Software Engineering',
                volume: '15',
                issue: '3',
                pages: '145-167',
            },
            publishedAt: new Date('2024-01-15'),
            doi: '10.1000/journal.2024.001',
            category: 'Computer Science',
            license: 'CC BY 4.0',
            viewCount: 234,
        },
        {
            originalId: '55555555-5555-5555-5555-555555555555',
            title: 'Database Design Patterns for Distributed Systems',
            abstract: 'A comprehensive guide to database design patterns that ensure consistency and performance in distributed systems.',
            keywords: ['database', 'distributed systems', 'patterns', 'consistency'],
            type: 'ARTICLE',
            primaryAuthor: 'Jane Reviewer',
            coAuthors: ['Bob Smith'],
            metadata: {
                journal: 'International Journal of Database Systems',
                volume: '22',
                issue: '8',
                pages: '89-112',
            },
            publishedAt: new Date('2024-12-01'),
            doi: '10.1000/ijdb.2024.022',
            category: 'Database Systems',
            license: 'CC BY-SA 4.0',
            viewCount: 156,
        },
        {
            originalId: '66666666-6666-6666-6666-666666666666',
            title: 'Machine Learning Algorithms for Predictive Analytics',
            abstract: 'An in-depth analysis of machine learning algorithms and their applications in predictive analytics across various industries.',
            keywords: ['machine learning', 'predictive analytics', 'algorithms', 'data science'],
            type: 'ARTICLE',
            primaryAuthor: 'Bob Smith',
            coAuthors: [],
            metadata: {
                journal: 'AI Research Quarterly',
                volume: '8',
                issue: '2',
                pages: '45-78',
            },
            publishedAt: new Date('2024-11-20'),
            doi: '10.1000/airesearch.2024.008',
            category: 'Artificial Intelligence',
            license: 'CC BY-NC 4.0',
            viewCount: 467,
        },
        {
            originalId: '77777777-7777-7777-7777-777777777777',
            title: 'Complete Guide to Software Engineering',
            abstract: 'A comprehensive book covering all aspects of modern software engineering practices, from requirements gathering to deployment.',
            keywords: ['software engineering', 'best practices', 'methodology', 'development'],
            type: 'BOOK',
            primaryAuthor: 'Bob Smith',
            coAuthors: ['John Author'],
            metadata: {
                publisher: 'Tech Books Publishing',
                edition: 'First Edition',
                totalPages: '450',
            },
            publishedAt: new Date('2024-10-15'),
            isbn: '978-0-123456-78-9',
            category: 'Software Engineering',
            license: 'All Rights Reserved',
            viewCount: 1024,
        },
        {
            originalId: '88888888-8888-8888-8888-888888888888',
            title: 'Cloud Computing Security Fundamentals',
            abstract: 'Essential security considerations and best practices for cloud computing environments.',
            keywords: ['cloud computing', 'security', 'cybersecurity', 'infrastructure'],
            type: 'ARTICLE',
            primaryAuthor: 'Jane Reviewer',
            coAuthors: [],
            metadata: {
                journal: 'Cloud Security Review',
                volume: '5',
                issue: '12',
                pages: '201-225',
            },
            publishedAt: new Date('2024-09-30'),
            doi: '10.1000/cloudsec.2024.005',
            category: 'Cybersecurity',
            license: 'CC BY 4.0',
            viewCount: 389,
        },
    ];

    for (const pubData of catalogPublications) {
        const existingPub = await prisma.catalogPublication.findUnique({
            where: { originalId: pubData.originalId },
        });

        if (!existingPub) {
            await prisma.catalogPublication.create({
                data: pubData,
            });
                    console.log(`Created catalog publication: ${pubData.title}`);
      } else {
        console.log(`Catalog publication already exists: ${pubData.title}`);
        }
    }

    // Create some search statistics
    const searchStats = [
        {
            query: 'microservices',
            resultCount: 15,
            executionTimeMs: 45,
            filters: {
                category: 'Computer Science',
                year: '2024',
            },
        },
        {
            query: 'machine learning',
            resultCount: 23,
            executionTimeMs: 62,
            filters: {
                category: 'Artificial Intelligence',
            },
        },
        {
            query: 'database design',
            resultCount: 8,
            executionTimeMs: 31,
            filters: {
                type: 'ARTICLE',
            },
        },
    ];

    for (const stat of searchStats) {
        await prisma.searchStatistics.create({
            data: stat,
        });
    }

    console.log('Created search statistics');
    console.log('Catalog database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });