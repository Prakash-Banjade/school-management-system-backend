import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRecommendationDto } from './create-recommendation.dto';

export class UpdateRecommendationDto extends PartialType(OmitType(CreateRecommendationDto, ['userId'])) { }
