import { Body, Controller, Post } from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import { Public } from 'src/common/decorators/setPublicRoute.decorator';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';

@Controller('passkey')
export class PasskeyController {
    constructor(
        private readonly passkeyService: PasskeyService
    ) { }

    @Post('register')
    @CheckAbilities({ subject: Role.USER, action: Action.CREATE })
    register() {
        return this.passkeyService.registerPassKey();
    }

    @Post('verify-register')
    @Public()
    verifyRegisterPasskey(@Body() payload: any) {
        return this.passkeyService.verifyRegisterPasskey(payload);
    }
}
