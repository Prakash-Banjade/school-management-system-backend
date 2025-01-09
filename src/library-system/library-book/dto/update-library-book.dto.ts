import { PartialType } from '@nestjs/swagger';
import { CreateLibraryBookDto } from './create-library-book.dto';

export class UpdateLibraryBookDto extends PartialType(CreateLibraryBookDto) {
}
