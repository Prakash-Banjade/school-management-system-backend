import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class TaskSubmissionQueryDto extends QueryDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    taskId: string;
}