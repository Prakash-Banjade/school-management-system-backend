import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUuidOrUrl } from 'src/common/decorators/validators/isUrlOrUUid.decorator';

export class CreateTaskSubmissionDto {
    @ApiProperty({ format: 'uuid', example: '00000000-0000-0000-0000-000000000000', description: 'ID of the task' })
    @IsUUID()
    @IsNotEmpty()
    taskId: string;

    @ApiProperty({ example: 'Assignment content or file link', description: 'Content of the submission', required: false })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200, { message: 'Content cannot be longer than 200 characters' })
    content: string;

    @ApiPropertyOptional({ example: 'Attachment IDs', description: 'IDs of the attachments', required: false })
    @IsUuidOrUrl({ each: true, message: 'Attachment IDs must be either a valid UUID or a valid URL' })
    @IsOptional()
    @IsArray()
    attachmentIds?: string[];
}
