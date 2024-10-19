import { Module } from '@nestjs/common';
import { FeesTypesService } from './fees-types.service';
import { FeesTypesController } from './fees-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesType } from './entities/fees-type.entity';
import { FeesGroupsModule } from '../fees-groups/fees-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeesType,
    ]),
    FeesGroupsModule,
  ],
  controllers: [FeesTypesController],
  providers: [FeesTypesService],
})
export class FeesTypesModule { }
