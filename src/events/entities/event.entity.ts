import { BaseEntity } from 'src/common/entities/base.entity';
import { Role } from 'src/common/types/global.type';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Event extends BaseEntity {

    @Column({ type: 'varchar' })
    title: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @Column({ type: 'datetime' })
    dateFrom: Date;

    @Column({ type: 'datetime' })
    dateTo: Date;

    @Column({ type: 'varchar' })
    eventLocation: string;

    @Column('simple-array', { nullable: true })
    members: string[];
}
