import { PrismaClient, Author, PublicationStatus, PublicationType } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting publications database seeding...');
    const authors = [
        {
            firstName: 'John',
            lastName: 'Author',
            email: 'author@test.com',
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
            orcid: '0000-0001-2345-6789',
            biography: 'Experienced researcher in computer science and software engineering.',
        },
        {
            firstName: 'Jane',
            lastName: 'Reviewer',
            email: 'reviewer@test.com',
            affiliation: 'Universidad de las Fuerzas Armadas ESPE',
            orcid: '0000-0002-3456-7890',
            biography: 'Expert reviewer with 10+ years in academic publishing.',
        },
        {
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'bob.smith@test.com',
            affiliation: 'MIT',
            orcid: '0000-0003-4567-8901',
            biography: 'AI and Machine Learning specialist.',
        },
    ];
    const createdAuthors: Author[] = [];
    for (const authorData of authors) {
        const existingAuthor = await prisma.author.findUnique({
            where: { email: authorData.email },
        });
        if (!existingAuthor) {
            const author = await prisma.author.create({
                data: authorData,
            });
            createdAuthors.push(author);
            console.log(`Created author: ${authorData.email}`);
        } else {
            createdAuthors.push(existingAuthor);
            console.log(`Author already exists: ${authorData.email}`);
        }
    }
    const publications = [
        {
            title: 'Microservices Architecture in Modern Applications',
            abstract: 'This paper explores the implementation of microservices architecture patterns and their benefits in modern cloud-native applications.',
            keywords: ['microservices', 'architecture', 'cloud', 'scalability'],
            status: PublicationStatus.PUBLISHED,
            type: PublicationType.ARTICLE,
            primaryAuthorId: createdAuthors[0].id,
            coAuthorIds: [createdAuthors[1].id],
            publishedAt: new Date('2024-01-15'),
            metadata: {
                targetAudience: 'Software Engineers',
                difficulty: 'Intermediate',
            },
        },
        {
            title: 'Database Design Patterns for Distributed Systems',
            abstract: 'A comprehensive guide to database design patterns that ensure consistency and performance in distributed systems.',
            keywords: ['database', 'distributed systems', 'patterns', 'consistency'],
            status: PublicationStatus.IN_REVIEW,
            type: PublicationType.ARTICLE,
            primaryAuthorId: createdAuthors[1].id,
            coAuthorIds: [createdAuthors[2].id],
            submittedAt: new Date('2024-12-01'),
            metadata: {
                targetAudience: 'Database Administrators',
                difficulty: 'Advanced',
            },
        },
        {
            title: 'Complete Guide to Software Engineering',
            abstract: 'A comprehensive book covering all aspects of modern software engineering practices.',
            keywords: ['software engineering', 'best practices', 'methodology'],
            status: PublicationStatus.DRAFT,
            type: PublicationType.BOOK,
            primaryAuthorId: createdAuthors[2].id,
            coAuthorIds: [],
            metadata: {
                targetAudience: 'Software Engineers',
                difficulty: 'Beginner to Advanced',
            },
        },
    ];
    for (const pubData of publications) {
        const existingPub = await prisma.publication.findFirst({
            where: { title: pubData.title },
        });
        if (!existingPub) {
            const { primaryAuthorId, coAuthorIds, ...publicationData } = pubData;
            const publication = await prisma.publication.create({
                data: {
                    ...publicationData,
                    author: {
                        connect: { id: primaryAuthorId },
                    },
                    coAuthors: {
                        connect: coAuthorIds.map(id => ({ id })),
                    },
                },
            });
            if (pubData.type === 'ARTICLE') {
                await prisma.article.create({
                    data: {
                        publicationId: publication.id,
                        targetJournal: 'Journal of Software Engineering',
                        section: 'Research Articles',
                        bibliographicReferences: [
                            'Smith, J. (2023). Modern Software Architecture.',
                            'Brown, A. (2022). Distributed Systems Design.',
                        ],
                        figureCount: 5,
                        tableCount: 3,
                    },
                });
            } else if (pubData.type === 'BOOK') {
                const book = await prisma.book.create({
                    data: {
                        publicationId: publication.id,
                        isbn: '978-0-123456-78-9',
                        pageCount: 450,
                        edition: 'First Edition',
                    },
                });
                await prisma.chapter.createMany({
                    data: [
                        {
                            bookId: book.id,
                            chapterNumber: 1,
                            title: 'Introduction to Software Engineering',
                            abstract: 'Basic concepts and principles of software engineering.',
                            pageStart: 1,
                            pageEnd: 25,
                        },
                        {
                            bookId: book.id,
                            chapterNumber: 2,
                            title: 'Software Development Life Cycle',
                            abstract: 'Overview of different SDLC methodologies.',
                            pageStart: 26,
                            pageEnd: 75,
                        },
                    ],
                });
            }
            console.log(`Created publication: ${pubData.title}`);
        } else {
            console.log(`Publication already exists: ${pubData.title}`);
        }
    }
    const publishedPub = await prisma.publication.findFirst({
        where: { status: 'PUBLISHED' },
    });
    if (publishedPub) {
        const existingReview = await prisma.review.findFirst({
            where: { 
                publicationId: publishedPub.id,
                reviewerId: createdAuthors[1].id,
            },
        });
        if (!existingReview) {
            await prisma.review.create({
                data: {
                    publicationId: publishedPub.id,
                    reviewerId: createdAuthors[1].id,
                    reviewStatus: 'ACCEPTED',
                    comments: 'Excellent work with comprehensive coverage of microservices patterns.',
                    score: 9,
                },
            });
            console.log('Created sample review');
        }
    }
    console.log('Publications database seeding completed!');
}
main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });