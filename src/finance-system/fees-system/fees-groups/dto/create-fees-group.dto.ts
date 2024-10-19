import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";
import { EFeeGroupAppliedTo } from "src/core/types/global.types";

export class CreateFeesGroupDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ enum: EFeeGroupAppliedTo })
    @IsEnum(EFeeGroupAppliedTo)
    @IsNotEmpty()
    appliedTo: EFeeGroupAppliedTo;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    @ValidateIf((o) => o.appliedTo === EFeeGroupAppliedTo.CLASS)
    classRoomId: string;
}
