import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { EClassType } from "src/common/types/global.type";

export class CreateClassRoomDto {
    @ApiProperty({ type: String, example: 'Class 10', description: 'Name of the class room' })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiPropertyOptional({ type: String, example: 'Description', description: 'Description of the class room' })
    @IsString()
    @IsOptional()
    description?: string

    @ApiPropertyOptional({ type: String, format: 'uuid', example: 'Parent Class ID', description: 'ID of the parent class' })
    @IsUUID()
    @IsOptional()
    parentClassId?: string

    @ApiProperty({ type: Number, example: 1000, description: 'Monthly tution fee of the class room' })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    monthlyTutionFee: number;

    @ApiProperty({ type: Number, example: 1000, description: 'Monthly fee of the class room' })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @IsOptional()
    monthlyFee: number;

    @ApiPropertyOptional({ type: String, example: 'Room No. 34, Block 1, Floor 1', description: 'Location of the class room' })
    @IsString()
    @IsOptional()
    location?: string

    @ApiPropertyOptional({ type: String, example: 'Primary', description: 'Type of the class room', default: EClassType.PRIMARY })
    @IsEnum(EClassType)
    @IsOptional()
    classType: EClassType = EClassType.PRIMARY;

    @ApiPropertyOptional({ type: String, format: 'uuid', example: 'Teacher ID', description: 'ID of the teacher' })
    @IsUUID()
    @IsOptional()
    classTeacherId?: string;
}
