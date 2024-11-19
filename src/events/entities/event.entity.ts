import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/common/types/global.type';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Event extends BaseEntity {

    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @Column({ type: 'timestamp' })
    dateFrom: Date;

    @Column({ type: 'timestamp' })
    dateTo: Date;

    @Column({ type: 'varchar', default: '' })
    eventLocation: string;

    @Column('simple-array', { nullable: true })
    members: string[];
}
