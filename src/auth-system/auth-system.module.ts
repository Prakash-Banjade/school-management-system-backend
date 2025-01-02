import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CaslModule } from './casl/casl.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from './jwt/jwt.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PasskeyModule } from './passkey/passkey.module';

@Module({
    imports: [
        UsersModule,
        AccountsModule,
        CaslModule,
        AuthModule,
        JwtModule,
        EncryptionModule,
        PasskeyModule,
    ]
})
export class AuthSystemModule { }
