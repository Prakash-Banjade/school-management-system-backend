import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNumber, IsString, IsUUID, Min } from "class-validator";
import { EPaymentMethod } from "src/common/types/global.type";

export class CreateSalaryPaymentDto {
    @ApiProperty({
        type: String,
        format: 'uuid',
        description: 'The unique identifier of the employee receiving the salary payment.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    employeeId: string;

    @ApiProperty({
        type: Number,
        description: 'The salary amount being paid to the employee.',
        example: 50000,
    })
    @IsNumber()
    @Min(0, { message: 'Amount must be greater than or equal to 0' })
    amount: number;

    @ApiProperty({
        type: String,
        enum: EPaymentMethod,
        description: 'The method used for salary payment (e.g., CASH, BANK_TRANSFER, CHECK).',
        example: EPaymentMethod.BANK,
    })
    @IsEnum(EPaymentMethod)
    paymentMethod: EPaymentMethod;

    @ApiProperty({
        type: String,
        format: 'date-time',
        description: 'The date when the salary payment was made. Must be in ISO 8601 format.',
        example: '2024-02-01T10:30:00.000Z',
    })
    @IsDateString()
    paymentDate: string;

    @ApiPropertyOptional({
        type: String,
        description: 'An optional remark or note for the salary payment.',
        example: 'Bonus for excellent performance',
    })
    @IsString()
    remark?: string = '';
}
