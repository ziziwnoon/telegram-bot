import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpEntity } from '../user/entities/otp.entity';
import { join } from 'path';
import { readFileSync } from 'fs';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @InjectRepository(OtpEntity) private otpRepository: Repository<OtpEntity>,
    ) {}

    async checkExistingUser(chatId: number){
        const user = await this.userRepository.findOneBy({chatId})
        return user;
    }


    async processUserData(course: string, mobile: string) {
        const filePath = join(process.cwd(), `${course}-course.json`)
        
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        const user = await this.checkUserInCourseList(data, mobile);
        return user;
    }


    async checkUserInCourseList(data, mobile: string) {
        for (const user of data) {
            if (user.mobile == mobile) {
                return user;
            }
        }
        return null;
    }

    async deleteInvalidUserAccount(userId: number) {
        const user = await this.userRepository.findOneBy({ id: userId });
        await this.userRepository.remove(user)
        return true;
    }


    async saveOtp(userId: number){
        const code = randomInt(10000 , 99999).toString();
        const expiresIn = new Date(Date.now() + (1000 * 60 * 5))
        let existingOtp = false
        let otp = await this.otpRepository.findOneBy({userId})

        if(otp){
            existingOtp = true
            otp.code = code
            otp.expiresIn = expiresIn
        } else {
            otp = this.otpRepository.create({code , expiresIn , userId })
        }

        otp = await this.otpRepository.save(otp)

        if(!existingOtp){
            await this.userRepository.update({id: userId} , {otpId : otp.id})
        }

        return otp
    }


    async checkOtp(chatId: number, code: string) {
        const user = await this.checkExistingUser(chatId)

        const otp = await this.otpRepository.findOneBy({ userId: user.id });
        if (!otp) throw new UnauthorizedException(`کد وارد شده اشتباه است❗`);

        const now = new Date();
        if (otp.expiresIn < now) throw new UnauthorizedException(`کد یکبار مصرف منقضی شده است`);
        if (otp.code !== code) throw new UnauthorizedException(`کد وارد شده اشتباه است❗`);
        user.mobileVerified = 1;
        await this.userRepository.save(user)
        return {
            message: 
            `
            ${user.fullName} عزیز خوش آمدید🥰
            `
        }
    }
}
