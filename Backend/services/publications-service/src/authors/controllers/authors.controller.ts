import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthorsService } from '../services/authors.service';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { MicroserviceAuthGuard } from '../../common/guards/microservice-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoles } from '../../common/enums/user-roles.enum';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('Authors')
@Controller('authors')
@UseGuards(MicroserviceAuthGuard)
@ApiBearerAuth()
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new author' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Author created successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Author already exists' })
  @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
  async createAuthor(
    @Body() createAuthorDto: CreateAuthorDto,
    @Request() req: any,
  ) {
    return this.authorsService.createAuthor(createAuthorDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all authors with filters' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'affiliation', required: false, description: 'Filter by affiliation' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authors retrieved successfully',
  })
  async getAllAuthors(
    @Query('search') search?: string,
    @Query('affiliation') affiliation?: string,
    @Query('isActive') isActive?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.authorsService.getAllAuthors({
      search,
      affiliation,
      isActive,
      page,
      limit,
    });
  }

  @Get('top-contributors')
  @ApiOperation({ summary: 'Get top authors by publication count' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top authors to return' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top contributors retrieved successfully',
  })
  async getTopContributors(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.authorsService.getTopContributors(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search authors by various criteria' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'field', required: false, enum: ['name', 'email', 'affiliation', 'orcid'], description: 'Search field' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
  })
  async searchAuthors(
    @Query('q') query: string,
    @Query('field') field?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.authorsService.searchAuthors(query, {
      field,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get author details by ID' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  async getAuthorById(@Param('id', UuidValidationPipe) id: string) {
    return this.authorsService.getAuthorById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update author information' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author updated successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
  async updateAuthor(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @Request() req: any,
  ) {
    return this.authorsService.updateAuthor(id, updateAuthorDto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an author (soft delete)' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Author deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Author has associated publications' })
  @Roles(UserRoles.ADMIN)
  async deleteAuthor(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: any,
  ) {
    return this.authorsService.deleteAuthor(id, req.user.sub);
  }

  @Get(':id/publications')
  @ApiOperation({ summary: 'Get all publications by an author' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiQuery({ name: 'role', required: false, enum: ['primary', 'coauthor', 'all'], description: 'Author role filter' })
  @ApiQuery({ name: 'status', required: false, description: 'Publication status filter' })
  @ApiQuery({ name: 'type', required: false, description: 'Publication type filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author publications retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  async getAuthorPublications(
    @Param('id', UuidValidationPipe) id: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.authorsService.getAuthorPublications(id, {
      role,
      status,
      type,
      page,
      limit,
    });
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get all reviews done by an author' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Review status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author reviews retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  async getAuthorReviews(
    @Param('id', UuidValidationPipe) id: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.authorsService.getAuthorReviews(id, {
      status,
      page,
      limit,
    });
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get author statistics' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author statistics retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  async getAuthorStatistics(@Param('id', UuidValidationPipe) id: string) {
    return this.authorsService.getAuthorStatistics(id);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate an author account' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author activated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
  async activateAuthor(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: any,
  ) {
    return this.authorsService.activateAuthor(id, req.user.sub);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an author account' })
  @ApiParam({ name: 'id', description: 'Author ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author deactivated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Author not found' })
  @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
  async deactivateAuthor(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: any,
  ) {
    return this.authorsService.deactivateAuthor(id, req.user.sub);
  }
}