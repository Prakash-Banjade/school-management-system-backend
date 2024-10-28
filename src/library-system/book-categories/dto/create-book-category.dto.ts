import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookCategoryDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;
}
