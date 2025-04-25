import { Controller, Get, Query } from '@nestjs/common';
import { StudentLedgersService } from './student-ledgers.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, AuthUser, Role } from 'src/common/types/global.type';
import { LedgerQueryDto } from './dto/ledger-query.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Student Ledgers')
@Controller('student-ledgers')
export class StudentLedgersController {
  constructor(private readonly studentLedgersService: StudentLedgersService) { }


  @Get()
  @ApiOperation({ summary: 'Get all student ledgers' })
  @ApiResponse({ status: 200, description: 'Student ledgers returned successfully' })
  @CheckAbilities(
    { subject: Role.ADMIN, action: Action.READ },
    { subject: Role.STUDENT, action: Action.READ },
  )
  findAllLedgerItems(@Query() queryDto: LedgerQueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.studentLedgersService.findAll(queryDto, currentUser);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get student ledger statistics' })
  @ApiResponse({ status: 200, description: 'Student ledger statistics returned successfully' })
  @CheckAbilities({ subject: Role.STUDENT, action: Action.READ })
  getStatistics(@CurrentUser() currentUser: AuthUser) {
    return this.studentLedgersService.getStatistics(currentUser);
  }
}
