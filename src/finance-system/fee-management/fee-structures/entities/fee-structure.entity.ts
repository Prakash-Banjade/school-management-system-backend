import { ClassRoom } from "src/class-rooms/entities/class-room.entity";
import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { ChargeHead } from "../../charge-heads/entities/charge-head.entity";

@Entity()
export class FeeStructure extends BaseEntity {
    @ManyToOne(() => ClassRoom, classRoom => classRoom.feeStructures, { onDelete: 'CASCADE', nullable: false })
    classRoom: ClassRoom;

    @ManyToOne(() => ChargeHead, chargeHead => chargeHead.feeStructures, { onDelete: 'CASCADE', nullable: true })
    chargeHead: ChargeHead;

    @Column({ type: 'float', precision: 10, scale: 2 })
    amount: number;
}
