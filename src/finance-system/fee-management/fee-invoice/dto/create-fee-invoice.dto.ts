import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from "class-validator";
import { EMonth } from "src/common/types/months";

class InvoiceItemsDto {
    @ApiProperty({ description: 'Amount', type: 'number', minimum: 0 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ format: "uuid", type: 'string', description: 'Charge head id' })
    @IsUUID()
    chargeHeadId: string;

    @ApiProperty({ description: 'Discount', type: 'number', minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    discount: number;

    @ApiPropertyOptional({ type: 'string', description: 'Remark', maxLength: 100 })
    @IsString()
    @IsOptional()
    @Length(0, 100, { message: 'Remark must be less than 100 characters' })
    remark?: string;
}

export class CreateFeeInvoiceDto {
    @ApiProperty({ type: 'string', format: 'uuid', description: 'Student id' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ description: 'Due date', type: 'string', format: 'date' })
    @IsDateString()
    dueDate: string;

    @ApiProperty({ description: 'Invoice date', type: 'string', format: 'date' })
    @IsDateString()
    invoiceDate: string;

    @ApiProperty({ enum: EMonth, description: 'Month' })
    @IsEnum(EMonth)
    month: EMonth;

    @ApiProperty({ description: 'Invoice items', isArray: true, type: InvoiceItemsDto })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemsDto)
    invoiceItems: InvoiceItemsDto[];
}