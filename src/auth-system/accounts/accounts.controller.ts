import { Controller, Get, Param, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccountsService } from "./accounts.service";
import { CheckAbilities } from "src/common/decorators/abilities.decorator";
import { Action, Role } from "src/common/types/global.type";
import { FastifyRequest } from "fastify";

@ApiBearerAuth()
@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService
    ) { }

    @Get('devices')
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    getDevices(@Req() req: FastifyRequest) {
        return this.accountsService.getDevices(req);
    }

    @Patch('devices/:deviceId/revoke')
    @CheckAbilities({ subject: Role.USER, action: Action.UPDATE })
    revokeDevice(@Param('deviceId') deviceId: string) {
        return this.accountsService.revokeDevice(deviceId);
    }
}