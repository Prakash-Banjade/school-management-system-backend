import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { IsFutureDate } from "src/common/decorators/validators/isFutureDate.decorator";

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
    dueDate: string;
}
