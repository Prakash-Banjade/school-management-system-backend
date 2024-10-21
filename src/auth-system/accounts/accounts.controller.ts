import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccountsService } from "./accounts.service";
import { CurrentUser } from "src/common/decorators/user.decorator";
import { AuthUser } from "src/common/types/global.type";

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService,
    ) { }

    @Get('me')
    me(@CurrentUser() currentUser: AuthUser) {
        return this.accountsService.me(currentUser);
    }
}