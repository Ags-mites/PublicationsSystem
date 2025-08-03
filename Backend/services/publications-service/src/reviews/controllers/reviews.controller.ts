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
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { CompleteReviewDto } from '../dto/complete-review.dto';
import { MicroserviceAuthGuard } from '../../common/guards/microservice-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoles } from '../../common/enums/user-roles.enum';
import { ReviewStatus } from '../../common/enums/review-status.enum';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(MicroserviceAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review for a publication' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review created successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @Roles(UserRoles.REVIEWER, UserRoles.EDITOR, UserRoles.ADMIN)
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ) {
    return this.reviewsService.createReview(createReviewDto, req.user.sub);
  }

  @Get('publication/:publicationId')
  @ApiOperation({ summary: 'Get all reviews for a publication' })
  @ApiParam({ name: 'publicationId', description: 'Publication ID' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
  })
  async getReviewsByPublication(
    @Param('publicationId', UuidValidationPipe) publicationId: string,
    @Query('status') status?: ReviewStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.reviewsService.getReviewsByPublication(publicationId, {
      status,
      page,
      limit,
    });
  }

  @Get('reviewer/:reviewerId')
  @ApiOperation({ summary: 'Get all reviews assigned to a reviewer' })
  @ApiParam({ name: 'reviewerId', description: 'Reviewer ID' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
  })
  async getReviewsByReviewer(
    @Param('reviewerId', UuidValidationPipe) reviewerId: string,
    @Query('status') status?: ReviewStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.reviewsService.getReviewsByReviewer(reviewerId, {
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review details by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async getReviewById(@Param('id', UuidValidationPipe) id: string) {
    return this.reviewsService.getReviewById(id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review completed successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  @Roles(UserRoles.REVIEWER, UserRoles.EDITOR, UserRoles.ADMIN)
  async completeReview(
    @Param('id', UuidValidationPipe) id: string,
    @Body() completeReviewDto: CompleteReviewDto,
    @Request() req: any,
  ) {
    return this.reviewsService.completeReview(id, completeReviewDto, req.user.sub);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign a review to a reviewer' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review assigned successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  @Roles(UserRoles.EDITOR, UserRoles.ADMIN)
  async assignReview(
    @Param('id', UuidValidationPipe) id: string,
    @Body('reviewerId') reviewerId: string,
    @Request() req: any,
  ) {
    return this.reviewsService.assignReview(id, reviewerId, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Review deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
  async deleteReview(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req: any,
  ) {
    return this.reviewsService.deleteReview(id, req.user.sub);
  }

  @Get(':id/change-requests')
  @ApiOperation({ summary: 'Get change requests for a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Change requests retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Review not found' })
  async getChangeRequests(@Param('id', UuidValidationPipe) id: string) {
    return this.reviewsService.getChangeRequests(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ReviewStatus })
  @ApiQuery({ name: 'publicationId', required: false, description: 'Filter by publication' })
  @ApiQuery({ name: 'reviewerId', required: false, description: 'Filter by reviewer' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reviews retrieved successfully',
  })
  @Roles(UserRoles.EDITOR, UserRoles.ADMIN)
  async getAllReviews(
    @Query('status') status?: ReviewStatus,
    @Query('publicationId') publicationId?: string,
    @Query('reviewerId') reviewerId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.reviewsService.getAllReviews({
      status,
      publicationId,
      reviewerId,
      page,
      limit,
    });
  }
}