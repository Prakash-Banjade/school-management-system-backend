import { Global, Module } from '@nestjs/common';
import { UtilitiesService } from './utilities.service';
import { AcademicYearsModule } from 'src/academic-years/academic-years.module';

@Global()
@Module({
  imports: [
    AcademicYearsModule,
  ],
  providers: [UtilitiesService],
  exports: [UtilitiesService]
})
export class UtilitiesModule { }
