import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateBookTransactionDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    bookId: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    studentId: string;
}
