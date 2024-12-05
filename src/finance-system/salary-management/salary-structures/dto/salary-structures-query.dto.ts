import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";
import { Role } from "src/common/types/global.type";

const salaryStructureSortByQuery = {
    grossSalary: 'salaryStructure.grossSalary',
    basicSalary: 'salaryStructure.basicSalary',
}

export class SalaryStructuresQueryDto extends QueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Transform(({ value }) => {
        if (value in salaryStructureSortByQuery) return salaryStructureSortByQuery[value];
        return 'salaryStructure.createdAt';
    })
    sortBy?: string = 'salaryStructure.createdAt';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (value) return value.split(',');
        return [];
    })
    designations?: Role[]
}