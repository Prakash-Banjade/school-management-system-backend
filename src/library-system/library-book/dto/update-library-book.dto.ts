import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateLibraryBookDto } from './create-library-book.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLibraryBookDto extends PartialType(CreateLibraryBookDto) {
    @ApiPropertyOptional({ type: Boolean, description: 'Available or not' })
    @IsBoolean()
    @IsOptional()
    available: boolean
}
