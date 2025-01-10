import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateIf } from "class-validator";
import { EClassType, EDegreeLevel } from "src/common/types/global.type";

export class CreateClassRoomDto {
    @ApiProperty({ type: String, example: 'Class 10', description: 'Name of the class room' })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiPropertyOptional({ type: String, example: 'Description', description: 'Description of the class room' })
    @IsString()
    @IsOptional()
    @Length(0, 500, { message: 'Description must be less than 500 characters' })
    description?: string

    @ApiProperty()
    @IsUUID()
    facultyId: string;

    @ApiProperty({ type: String, example: 'Primary', description: 'Type of the class room' })
    @IsEnum(EClassType)
    classType: EClassType

    @ApiPropertyOptional({ type: String, format: 'uuid', example: 'Parent Class ID', description: 'ID of the parent class' })
    @IsUUID()
    @ValidateIf((o: CreateClassRoomDto) => o.classType === EClassType.SECTION)
    parentClassId?: string

    @ApiProperty({ type: Number, example: 1000, description: 'Monthly tution fee of the class room' })
    @IsNumber()
    @Min(0)
    @ValidateIf((o: CreateClassRoomDto) => o.classType === EClassType.PRIMARY)
    admissionFee: number;

    @ApiProperty({ type: Number, example: 1000, description: 'Monthly fee of the class room' })
    @IsNumber()
    @Min(0)
    @ValidateIf((o: CreateClassRoomDto) => o.classType === EClassType.PRIMARY && [EDegreeLevel.Basic_School, EDegreeLevel.Plus_Two].includes(o.degreeLevel))
    monthlyFee: number;

    @ApiPropertyOptional({ type: String, example: 'Room No. 34, Block 1, Floor 1', description: 'Location of the class room' })
    @IsString()
    @IsOptional()
    location?: string

    @ApiPropertyOptional({ type: String, format: 'uuid', example: 'Teacher ID', description: 'ID of the teacher' })
    @IsUUID()
    @IsOptional()
    classTeacherId?: string;

    @ApiProperty()
    @IsEnum(EDegreeLevel)
    degreeLevel: EDegreeLevel;
}
