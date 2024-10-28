import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsUUID } from "class-validator";

export class CreateBookTransactionDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    bookId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    studentId: string;

    @ApiProperty({ format: 'date-time' })
    @IsDateString()
    dueDate: string;
}
