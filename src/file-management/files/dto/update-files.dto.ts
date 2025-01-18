import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFileDto {
    @ApiProperty({ type: "string", description: 'File Name' })
    @IsString()
    @IsNotEmpty()
    name: string
}
