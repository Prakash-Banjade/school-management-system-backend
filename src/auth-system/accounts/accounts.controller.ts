import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccountsService } from "./accounts.service";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { Action, AuthUser, Role } from "src/common/types/global.type";
import { CheckAbilities } from "src/common/decorators/abilities.decorator";

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService,
    ) { }

    @Get('me')
    @CheckAbilities(
        { subject: Role.ADMIN, action: Action.READ },
        { subject: Role.STUDENT, action: Action.READ }
    )
    me(@CurrentUser() currentUser: AuthUser) {
        return this.accountsService.me(currentUser);
    }
}