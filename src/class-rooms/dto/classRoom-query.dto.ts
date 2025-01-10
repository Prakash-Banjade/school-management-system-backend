import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EClassType } from "src/common/types/global.type";

export class ClassRoomQueryDto extends QueryDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    parentClassId?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    classType?: string = EClassType.PRIMARY; // default to primary class

    @ApiProperty()
    @IsString()
    @IsOptional()
    degreeLevel?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    facultyId?: string;
}

export class ClassRoomOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    onlyPrimaryClass?: boolean = false;
}