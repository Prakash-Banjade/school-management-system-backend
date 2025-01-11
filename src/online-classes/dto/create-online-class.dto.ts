import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { IsFutureDate } from "src/common/decorators/isFutureDate.decorator";

export class CreateOnlineClassDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    title: string;

    @ApiPropertyOptional()
    @IsString()
    @Length(1, 500)
    @IsOptional()
    @Transform(({ value }) => value?.trim())
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
    scheduleDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value?.trim())
    callId?: string;
}
