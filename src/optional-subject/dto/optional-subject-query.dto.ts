import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class OptionalSubjectQueryDto extends QueryDto {
    @ApiProperty({ format: "uuid" })
    @IsUUID()
    classRoomId: string;
}