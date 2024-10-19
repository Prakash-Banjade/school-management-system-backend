import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { QueryDto } from "src/common/dto/query.dto";

export class DealerQueryDto extends QueryDto {
    @ApiPropertyOptional({ type: String, description: 'PAN of the dealer' })
    @IsString()
    @IsOptional()
    panNo: string;

    @ApiPropertyOptional({ type: String, description: 'Account number of the dealer' })
    @IsString()
    @IsOptional()
    accountNumber: string;

    @ApiPropertyOptional({ type: String, description: 'Contact of the dealer' })
    @IsString()
    @IsOptional()
    contact: string;
}