import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
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
}

export class ClassRoomOptionsQueryDto extends QueryDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    classRoomId?: string;
}