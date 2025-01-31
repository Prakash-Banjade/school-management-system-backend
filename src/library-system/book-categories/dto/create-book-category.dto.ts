import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookCategoryDto {
    @ApiProperty({ type: 'string', description: "Name of the book category" })
    @IsNotEmpty()
    @IsString()
    name: string;
}
