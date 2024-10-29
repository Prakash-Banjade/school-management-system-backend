import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";

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
    dueDate: string;
}
