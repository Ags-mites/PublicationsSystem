import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PublicationsService } from '../services/publications.service';
import { CreatePublicationDto, UpdatePublicationDto, PublicationResponseDto } from '../dto';
// import { MicroserviceAuthGuard } from '../../common/guards/microservice-auth.guard';

@ApiTags('Publications')
@Controller('publications')
// @UseGuards(MicroserviceAuthGuard)
// @ApiBearerAuth()
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new publication draft' })
  @ApiResponse({
    status: 201,
    description: 'Publication created successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createPublication(
    @Body() createPublicationDto: CreatePublicationDto,
    @Request() req: any,
  ): Promise<PublicationResponseDto> {
    // For development, use a default user ID when no authentication is present
    const userId = req.user?.sub || 'dev-user-id';
    return this.publicationsService.createPublication(createPublicationDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all publications with filters' })
  @ApiResponse({
    status: 200,
    description: 'Publications retrieved successfully',
    type: [PublicationResponseDto],
  })
  @ApiQuery({ name: 'primaryAuthorId', required: false, description: 'Filter by primary author' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'WITHDRAWN'] })
  @ApiQuery({ name: 'type', required: false, enum: ['ARTICLE', 'BOOK'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllPublications(
    @Query('primaryAuthorId') primaryAuthorId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.publicationsService.findAllPublications({
      primaryAuthorId,
      status: status as any,
      type: type as any,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a publication by ID' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication retrieved successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async findPublicationById(@Param('id') id: string): Promise<PublicationResponseDto> {
    return this.publicationsService.findPublicationById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a publication (only in DRAFT status)' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication updated successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async updatePublication(
    @Param('id') id: string,
    @Body() updatePublicationDto: UpdatePublicationDto,
    @Request() req: any,
  ): Promise<PublicationResponseDto> {
    const userId = req.user?.sub || 'dev-user-id';
    return this.publicationsService.updatePublication(id, updatePublicationDto, userId);
  }

  @Post(':id/submit-for-review')
  @ApiOperation({ summary: 'Submit a publication for review' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication submitted for review successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async submitForReview(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PublicationResponseDto> {
    const userId = req.user?.sub || 'dev-user-id';
    return this.publicationsService.submitForReview(id, userId);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a publication' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication approved successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async approvePublication(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PublicationResponseDto> {
    const userId = req.user?.sub || 'dev-user-id';
    return this.publicationsService.approvePublication(id, userId);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish a publication' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication published successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async publishPublication(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PublicationResponseDto> {
    const userId = req.user?.sub || 'dev-user-id';
    return this.publicationsService.publishPublication(id, userId);
  }

  @Put(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw a publication' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication withdrawn successfully',
    type: PublicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async withdrawPublication(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PublicationResponseDto> {
    const userId = req.user?.sub || 'dev-user-id';
    return this.publicationsService.withdrawPublication(id, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get publication history' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({
    status: 200,
    description: 'Publication history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async getPublicationHistory(@Param('id') id: string) {
    return this.publicationsService.getPublicationHistory(id);
  }
}