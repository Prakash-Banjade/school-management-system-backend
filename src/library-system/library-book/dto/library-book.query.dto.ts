import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class LibraryBookQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, description: "Comma separated category names" })
    @IsOptional()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    categories: string[]
}