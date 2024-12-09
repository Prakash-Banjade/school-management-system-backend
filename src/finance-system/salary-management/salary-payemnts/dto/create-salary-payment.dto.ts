import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNumber, IsString, IsUUID, Min } from "class-validator";
import { EPaymentMethod } from "src/common/types/global.type";

export class CreateSalaryPaymentDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    employeeId: string;

    @ApiProperty()
    @IsNumber()
    @Min(0, { message: 'Amount must be greater than or equal to 0' })
    amount: number

    @ApiProperty({ enum: EPaymentMethod })
    @IsEnum(EPaymentMethod)
    paymentMethod: EPaymentMethod;

    @ApiProperty()
    @IsDateString()
    paymentDate: string;

    @ApiPropertyOptional()
    @IsString()
    remark?: string = '';
}