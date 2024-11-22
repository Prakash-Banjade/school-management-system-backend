import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsUUID } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class ChargeHeadOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    classRoomId?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        return value === 'true';
    })
    onlyAvailable?: boolean = false;

    @ApiPropertyOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        return value === 'true';
    })
    defaults?: boolean = true;
}