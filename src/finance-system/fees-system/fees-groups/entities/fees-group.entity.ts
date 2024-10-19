import { BaseEntity } from "src/core/entities/base.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { FeesType } from "../../fees-types/entities/fees-type.entity";
import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { EFeeGroupAppliedTo } from "src/core/types/global.types";
import { BadRequestException } from "@nestjs/common";

@Entity()
export class FeesGroup extends BaseEntity {
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'longtext', nullable: true })
    description: string;

    @OneToMany(() => FeesType, (feesType) => feesType.feesGroup)
    feesTypes: FeesType[]

    @ManyToOne(() => ClassRoom, (classRoom) => classRoom.feesGroups, { onDelete: 'CASCADE', nullable: true })
    classRoom: ClassRoom

    @Column({ type: 'enum', enum: EFeeGroupAppliedTo, default: EFeeGroupAppliedTo.ALL })
    appliedTo: EFeeGroupAppliedTo;

    @BeforeInsert()
    @BeforeUpdate()
    validate() {
        if (this.appliedTo === EFeeGroupAppliedTo.CLASS && !this.classRoom) {
            throw new BadRequestException('Class room is required when applied to class.');
        }
        if (this.appliedTo === EFeeGroupAppliedTo.ALL) this.classRoom = null;
    }
}
