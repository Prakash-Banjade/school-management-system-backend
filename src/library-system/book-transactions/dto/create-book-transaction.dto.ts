import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";

export class CreateBookTransactionDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    bookId: string;

    @ApiProperty({ type: String })
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    @IsFutureDate({ message: 'The due date must be in the future.' })
    @Transform(({ value }) => {
        if (isNaN(Date.parse(value))) throw new BadRequestException('Invalid due date');
        return new Date(value).toISOString().split('T')[0];
    })
    dueDate: string;
}
