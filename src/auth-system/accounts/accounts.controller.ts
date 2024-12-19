import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccountsService } from "./accounts.service";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { Action, AuthUser, Role } from "src/common/types/global.type";
import { CheckAbilities } from "src/common/decorators/abilities.decorator";

@ApiBearerAuth()
@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService,
    ) { }

    @Get('me')
    @CheckAbilities({ subject: Role.USER, action: Action.READ })
    me(@CurrentUser() currentUser: AuthUser) {
        return this.accountsService.me(currentUser);
    }

    @Post(':id/send-new-credentials')
    @CheckAbilities({ subject: Role.ADMIN, action: Action.UPDATE })
    sendNewCredentials(@Param('id') id: string) {
        return this.accountsService.sendNewCredentials(id);
    }
}