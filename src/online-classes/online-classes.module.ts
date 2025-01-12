import { Module } from '@nestjs/common';
import { OnlineClassesService } from './online-classes.service';
import { OnlineClassesController } from './online-classes.controller';
import { StreamClientModule } from 'src/auth-system/stream-client/stream-client.module';

@Module({
  imports: [
    StreamClientModule,
  ],
  controllers: [OnlineClassesController],
  providers: [OnlineClassesService],
})
export class OnlineClassesModule { }
