import { BaseEntity } from "src/common/entities/base.entity";
import { Column, Entity } from "typeorm";

@Entity()
export class GeneralSetting extends BaseEntity {
    @Column({ type: 'float', default: 0 })
    libraryFine: number;

    @Column({ type: 'varchar', default: '' })
    currency: string;
}
