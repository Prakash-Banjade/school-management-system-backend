import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { FeesInvoicesService } from './fees-invoices.service';
import { CreateFeesInvoiceDto } from './dto/create-fees-invoice.dto';
import { QueryDto } from 'src/core/dto/query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateFeesInvoiceDto } from './dto/update-fees-invoice.dto';
import { TransactionInterceptor } from 'src/core/interceptors/transaction.interceptor';

@ApiBearerAuth()
@ApiTags('Fees Invoices')
@Controller('fees-invoices')
export class FeesInvoicesController {
  constructor(private readonly feesInvoicesService: FeesInvoicesService) { }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(@Body() createFeesInvoiceDto: CreateFeesInvoiceDto) {
    return this.feesInvoicesService.create(createFeesInvoiceDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto) {
    return this.feesInvoicesService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesInvoicesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(TransactionInterceptor)
  update(@Param('id') id: string, @Body() updateFeesInvoiceDto: UpdateFeesInvoiceDto) {
    return this.feesInvoicesService.update(id, updateFeesInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feesInvoicesService.remove(id);
  }
}
