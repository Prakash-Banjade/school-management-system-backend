import { Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { StudentLedgersService } from './student-ledgers.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckAbilities } from 'src/common/decorators/abilities.decorator';
import { Action, Role } from 'src/common/types/global.type';
import { LedgerQueryDto } from './dto/ledger-query.dto';

@ApiBearerAuth()
@ApiTags('Student Ledgers')
@Controller('student-ledgers')
export class StudentLedgersController {
  constructor(private readonly studentLedgersService: StudentLedgersService) { }


  // @Post('create-students-ledger') // TODO: remove in production
  // @CheckAbilities({ subject: Role.ADMIN, action: Action.CREATE })
  // @UseInterceptors(TransactionInterceptor)
  // createStudentsLedger() {
  //   return this.studentLedgersService.createStudentsLedger();
  // }

  @Get()
  @CheckAbilities({ subject: Role.ADMIN, action: Action.READ })
  findAllLedgerItems(@Query() queryDto: LedgerQueryDto) {
    return this.studentLedgersService.findAll(queryDto);
  }
}
