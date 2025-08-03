import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthorEntity } from '../entities/author.entity';

@Injectable()
export class AuthorsRepository {
  constructor(private readonly database: PrismaService) {}

  async findOne(id: string): Promise<AuthorEntity | null> {
    const author = await this.database.author.findUnique({
      where: { id },
    });

    return author ? new AuthorEntity(author) : null;
  }

  async findByEmail(email: string): Promise<AuthorEntity | null> {
    const author = await this.database.author.findUnique({
      where: { email },
    });

    return author ? new AuthorEntity(author) : null;
  }

  async findMany(ids: string[]): Promise<AuthorEntity[]> {
    const authors = await this.database.author.findMany({
      where: { id: { in: ids } },
    });

    return authors.map(author => new AuthorEntity(author));
  }
}
