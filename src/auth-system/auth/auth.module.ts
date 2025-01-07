import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AuthHelper } from './helpers/auth.helper';
import { JwtModule } from '../jwt/jwt.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { RefreshTokenService } from './helpers/refresh-tokens.service';
import { Auth2faHelper } from './helpers/auth-2fa.helper';

@Module({
  imports: [
    ImagesModule,
    JwtModule,
    EncryptionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthHelper,
    RefreshTokenService,
    Auth2faHelper,
  ],
  exports: [AuthService, AuthHelper, RefreshTokenService],
})
export class AuthModule { }
