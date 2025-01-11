import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";

export class CreateOnlineClassDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional()
    @IsString()
    @Length(1, 500)
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsUUID()
    classRoomId: string;

    @ApiProperty()
    @IsUUID()
    subjectId: string;

    @ApiPropertyOptional()
    @IsFutureDate()
    @IsOptional()
    scheduledAt?: string;
}
