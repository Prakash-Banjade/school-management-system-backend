import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { Repository } from 'typeorm';
import { AccountsService } from 'src/auth-system/accounts/accounts.service';
import { QueryDto } from 'src/common/dto/query.dto';
import paginatedData from 'src/utils/paginatedData';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation) private readonly recommendationRepo: Repository<Recommendation>,
    private readonly accountsService: AccountsService,
  ) { }

  async create(createRecommendationDto: CreateRecommendationDto) {
    const account = await this.accountsService.findOne(createRecommendationDto.accountId);

    const newRecommendation = this.recommendationRepo.create({
      ...createRecommendationDto,
      account,
    })

    const savedRecommendation = await this.recommendationRepo.save(newRecommendation);

    return this.recommendationMutationReturn(savedRecommendation, 'created');
  }

  async findAll(queryDto: QueryDto) {
    const querybuilder = this.recommendationRepo.createQueryBuilder('recommendation');

    querybuilder
      .orderBy('recommendation.createdAt', 'DESC')
      .take(queryDto.take)
      .skip(queryDto.skip);

    return paginatedData(queryDto, querybuilder);
  }

  async findOne(id: string) {
    const existingRecommendation = await this.recommendationRepo.findOne({
      where: {
        id
      }
    });

    if (!existingRecommendation) throw new NotFoundException('Recommendation not found');

    return existingRecommendation;
  }

  async update(id: string, updateRecommendationDto: UpdateRecommendationDto) {
    const existingRecommendation = await this.findOne(id);

    Object.assign(existingRecommendation, updateRecommendationDto);

    const savedRecommendation = await this.recommendationRepo.save(existingRecommendation);

    return this.recommendationMutationReturn(savedRecommendation, 'updated');
  }

  async remove(id: string) {
    const existingRecommendation = await this.findOne(id);
    const removedRecommendation = await this.recommendationRepo.remove(existingRecommendation);

    return this.recommendationMutationReturn(removedRecommendation, 'deleted');
  }

  private recommendationMutationReturn = (recommendation: Recommendation, type: 'created' | 'updated' | 'deleted') => {
    return {
      message: type === 'created' ? 'Recommendation created successfully' : type === 'deleted' ? 'Recommendation deleted successfully' : 'Recommendation updated successfully',
      recommendation: {
        id: recommendation.id,
        title: recommendation.title,
      }
    }
  }
}
