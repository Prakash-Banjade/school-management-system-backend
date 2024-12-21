import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ImagesModule } from 'src/file-management/images/images.module';
import { AuthHelper } from './helpers/auth.helper';
import { JwtModule } from '../jwt/jwt.module';
import { EncryptionModule } from '../encryption/encryption.module';

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
  ],
  exports: [AuthHelper]
})
export class AuthModule { }
