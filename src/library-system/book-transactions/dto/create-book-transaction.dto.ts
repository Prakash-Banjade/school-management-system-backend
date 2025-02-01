import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { IsFutureDate } from "src/common/decorators/validators/isFutureDate.decorator";

export class CreateBookTransactionDto {
    @ApiProperty({ format: 'uuid', description: 'Book id' })
    @IsUUID()
    bookId: string;

    @ApiProperty({ type: String, description: 'Student id' })
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ format: 'date-time', description: 'Due date' })
    @IsDateString()
    @IsFutureDate({ message: 'The due date must be in the future.' })
    dueDate: string;
}
