import { Body, Controller, Get, Param, ParseBoolPipe, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccountsService } from "./accounts.service";
import { CheckAbilities } from "src/common/decorators/abilities.decorator";
import { Action, Role } from "src/common/types/global.type";

@ApiBearerAuth()
@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService
    ) { }

    @Get('devices')
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    getDevices() {
        return this.accountsService.getDevices();
    }

    @Get('2fa/status')
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    get2FaStatus() {
        return this.accountsService.get2FaStatus();
    }

    @Patch('devices/:deviceId/revoke')
    @CheckAbilities({ subject: Role.USER, action: Action.UPDATE })
    revokeDevice(@Param('deviceId') deviceId: string) {
        return this.accountsService.revokeDevice(deviceId);
    }

    @Patch('2fa/toggle')
    @CheckAbilities({ subject: Role.USER, action: Action.UPDATE })
    toggle2Fa(@Body('toggle', ParseBoolPipe) enable2Fa: boolean) {
        return this.accountsService.toggle2Fa(enable2Fa);
    }

    @Get('get-stream-token')
    @CheckAbilities(
        { subject: Role.TEACHER, action: Action.READ },
        { subject: Role.STUDENT, action: Action.READ }
    )
    getStreamToken() {
        return this.accountsService.getStreamToken();
    }
}