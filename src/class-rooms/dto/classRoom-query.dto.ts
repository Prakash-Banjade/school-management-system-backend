import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { EClassType } from "src/common/types/global.type";

export class ClassRoomQueryDto extends QueryDto {
    @ApiProperty({ format: 'uuid', description: 'Parent class id' })
    @IsString()
    @IsOptional()
    parentClassId?: string;

    @ApiProperty({ enum: EClassType, description: 'Class type' })
    @IsString()
    @IsOptional()
    classType?: string = EClassType.PRIMARY; // default to primary class

    @ApiProperty({ format: 'uuid', description: 'Faculty id' })
    @IsString()
    @IsOptional()
    facultyId?: string;
}

export class ClassRoomOptionsQueryDto extends QueryDto {
    @ApiPropertyOptional({ description: 'Only primary class flag. If true, returns only primary classes' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    onlyPrimaryClass?: boolean = false;

    @ApiPropertyOptional({ format: 'uuid', description: 'Faculty id' })
    @IsString()
    @IsOptional()
    facultyId?: string;
}