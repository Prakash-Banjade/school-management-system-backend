import { ForbiddenException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { EDegreeLevel } from "src/common/types/global.type";

export class CreateFacultyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsInt()
    @Min(1, { message: 'Duration must be greater than 0' })
    duration: number; // month

    @ApiProperty({ enum: EDegreeLevel })
    @IsEnum(EDegreeLevel)
    @ValidateIf((o: CreateFacultyDto) => {
        if (o.degreeLevel === EDegreeLevel.Basic_School) throw new ForbiddenException('Cannot create faculty under Basic School.')

        return true;
    })
    degreeLevel: EDegreeLevel;
}
