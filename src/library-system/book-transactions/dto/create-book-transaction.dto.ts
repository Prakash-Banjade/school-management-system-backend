import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsUUID, ValidateIf } from "class-validator";
import { IsFutureDate } from "src/common/decorators/validators/isFutureDate.decorator";

export class CreateBookTransactionDto {
    @ApiProperty({ format: 'uuid', description: 'Book id' })
    @IsUUID()
    bookId: string;

    @ApiProperty({ type: String, description: 'Student id' })
    @IsUUID()
    @ValidateIf(o => !o.teacherId)
    studentId: string;

    @ApiProperty({ type: String, description: 'teacher id' })
    @IsUUID()
    @ValidateIf(o => !o.studentId)
    teacherId: string;

    @ApiProperty({ format: 'date-time', description: 'Due date' })
    @IsDateString()
    @IsFutureDate({ message: 'The due date must be in the future.' })
    dueDate: string;
}