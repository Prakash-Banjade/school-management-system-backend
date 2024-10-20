import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { UsersModule } from 'src/auth-system/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recommendation,
    ]),
    UsersModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule { }
