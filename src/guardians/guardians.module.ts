import { Module } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { GuardiansController } from './guardians.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guardian } from './entities/guardian.entity';
import { Student } from 'src/students/entities/student.entity';
import { ImagesModule } from 'src/file-management/images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Guardian,
      Student,
    ]),
    ImagesModule,
  ],
  controllers: [GuardiansController],
  providers: [GuardiansService],
  exports: [GuardiansService],
})
export class GuardiansModule { }
