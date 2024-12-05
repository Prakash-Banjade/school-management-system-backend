import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { EStaff } from "src/common/types/global.type";
import { CreateEmployeeDto } from "src/teachers/dto/create-teacher.dto";

export class CreateStaffDto extends CreateEmployeeDto {
    @ApiProperty({ type: 'enum', enum: EStaff, example: EStaff.DRIVER, description: 'Type of the staff' })
    @IsEnum(EStaff)
    type: EStaff
}
