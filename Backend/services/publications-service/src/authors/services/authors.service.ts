import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorsRepository } from '../repositories/authors.repository';
import { AuthorEntity } from '../entities/author.entity';

@Injectable()
export class AuthorsService {
  constructor(private readonly authorsRepository: AuthorsRepository) {}

  async findOne(id: string): Promise<AuthorEntity> {
    const author = await this.authorsRepository.findOne(id);
    
    if (!author) {
      throw new NotFoundException(`Author with ID ${id} not found`);
    }

    return author;
  }

  async findByEmail(email: string): Promise<AuthorEntity | null> {
    return this.authorsRepository.findByEmail(email);
  }

  async findMany(ids: string[]): Promise<AuthorEntity[]> {
    return this.authorsRepository.findMany(ids);
  }
}