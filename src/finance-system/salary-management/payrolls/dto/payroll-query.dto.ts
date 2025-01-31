import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

const employeesSortBy = {
    payAmount: 'salaryStructure.payAmount',
}

export class GetEmployeesQueryDto extends QueryDto {
    @ApiPropertyOptional({ format: 'uuid', description: 'Employee id' })
    @IsString()
    @IsOptional()
    employeeId?: string;

    @ApiPropertyOptional({ type: [String], description: 'Comma separated designations of the employees' })
    @IsOptional()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    designations?: string[]

    @ApiPropertyOptional({ type: 'string', enum: Object.keys(employeesSortBy), description: 'Sort By Key' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (value in employeesSortBy) return employeesSortBy[value];
        return 'salaryStructure.createdAt';
    })
    sortBy?: string = 'salaryStructure.createdAt';
}