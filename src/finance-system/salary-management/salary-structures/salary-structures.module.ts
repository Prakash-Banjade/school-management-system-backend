import { Module } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { SalaryStructuresController } from './salary-structures.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryStructure } from './entities/salary-structure.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalaryStructure,
    ])
  ],
  controllers: [SalaryStructuresController],
  providers: [SalaryStructuresService],
})
export class SalaryStructuresModule { }
