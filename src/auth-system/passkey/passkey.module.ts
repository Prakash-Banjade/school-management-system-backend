import { Module } from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import { PasskeyController } from './passkey.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Passkey } from './entities/passkey.entity';
import { PasskeyChallenge } from './entities/passkey-challenge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Passkey,
      PasskeyChallenge,
    ])
  ],
  providers: [PasskeyService],
  controllers: [PasskeyController]
})
export class PasskeyModule { }
