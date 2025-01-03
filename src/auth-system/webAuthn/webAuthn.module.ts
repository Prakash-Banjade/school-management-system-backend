import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebAuthnService } from './webAuthn.service';
import { WebAuthnController } from './webAuthn.controller';
import { WebAuthnCredential } from './entities/webAuthnCredential.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebAuthnCredential,
    ]),
    AuthModule,
    JwtModule,
  ],
  providers: [WebAuthnService],
  controllers: [WebAuthnController]
})
export class WebAuthnModule { }
