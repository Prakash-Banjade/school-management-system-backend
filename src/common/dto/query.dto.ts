import { ApiPropertyOptional } from "@nestjs/swagger";
import { PageOptionsDto } from "./pageOptions.dto";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export enum Deleted {
    ONLY = "only",
    NONE = "none",
    ALL = "all",
}

export class QueryDto extends PageOptionsDto {
    @ApiPropertyOptional({ type: String, enum: Deleted, description: "Option for deleted records", default: Deleted.NONE })
    @IsEnum(Deleted, { message: "Invalid deleted option" })
    @IsOptional()
    deleted: Deleted = Deleted.NONE

    @ApiPropertyOptional({ type: String, description: "Search query", default: "" })
    @IsOptional()
    search?: string

    @ApiPropertyOptional({ type: Boolean, default: false, description: "Skip pagination flag" })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    skipPagination?: boolean = false;

    @ApiPropertyOptional({ type: Boolean, description: 'Only basic info' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    onlyBasicInfo?: boolean = false;
}