import { BaseEntity } from "src/common/abstracts/base.entity";
import { EntityName } from "src/common/enums/entity.enum";
import { Column, Entity } from "typeorm";

@Entity(EntityName.SemesterPlan)
export class SemesterPlanEntity extends BaseEntity{
    @Column()
    title: string;
    @Column({ nullable: true, type: 'simple-array' })
    files: string[];
    @Column()
    course: string; 
    @Column()
    weekNo: number; // Number of week
    @Column()
    starts: string; // Start date
    @Column()
    ends: string;
    @Column()
    active: string;
}