import { BaseEntity } from "src/common/abstracts/base.entity";
import { EntityName } from "src/common/enums/entity.enum";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne } from "typeorm";
import { OtpEntity } from "./otp.entity";

@Entity(EntityName.User)
export class UserEntity extends BaseEntity {
    @Column({ nullable: true })
    studentId: string;
    @Column()
    chatId: number;
    @Column({ nullable: true })
    fullName: string;
    @Column({ nullable: true })
    mobile: string;
    @Column({ default: 0 })
    mobileVerified: number
    @Column({ nullable: true })
    course: string
    // @OneToMany(() => StudentHomeworkEntity, studentHomework => studentHomework.user)
    // homeworks: StudentHomeworkEntity[];
    @Column({ nullable: true })
    otpId: number
    @OneToOne(() => OtpEntity, otp => otp.user, { nullable: true })
    @JoinColumn({ name: "otpId" })
    otp: OtpEntity
    @CreateDateColumn()
    created_at: Date;
}