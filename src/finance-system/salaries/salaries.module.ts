import { Module } from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { SalariesController } from './salaries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salary } from './entities/salary.entity';
import { UsersModule } from 'src/auth-system/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Salary,
    ]),
    UsersModule,
  ],
  controllers: [SalariesController],
  providers: [SalariesService],
})
export class SalariesModule { }
