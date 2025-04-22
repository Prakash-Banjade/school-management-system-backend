import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUuidOrUrl } from 'src/common/decorators/validators/isUrlOrUUid.decorator';

export class CreateTaskSubmissionDto {
    @ApiProperty({ format: 'uuid', example: '00000000-0000-0000-0000-000000000000', description: 'ID of the task' })
    @IsUUID()
    @IsNotEmpty()
    taskId: string;

    @ApiPropertyOptional({ example: 'Assignment note or file link', description: 'Note of the submission', required: false })
    @IsString()
    @MaxLength(200, { message: 'Note cannot be longer than 200 characters' })
    @IsOptional()
    note?: string;

    @ApiPropertyOptional({ example: 'Attachment IDs', description: 'IDs of the attachments', required: false })
    @IsUuidOrUrl({ each: true, message: 'Attachment IDs must be either a valid UUID or a valid URL' })
    @IsOptional()
    @IsArray()
    attachmentIds?: string[];
}
