import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as TelegramBot from 'node-telegram-bot-api';
import { UserEntity } from "../user/entities/user.entity";
import { Repository } from "typeorm";
import { ChooseCourseKeyboard } from "./enums/choose-course-keyboard";
import { BotMainKeyboard } from "./enums/bot-main-keyboard.enum";
import { BotCallbackData, ChooseCourseCallbackData } from "./enums/bot-callback-keyboard.enum";
import { SemsterPlanCallback } from "./enums/weekly-plan-callback.enum";
import { join } from "path";
import { AuthService } from "../auth/auth.service";
@Injectable()
export class BotService implements OnModuleInit {
    private userStates: Map<number, { inlineKeyboardMessageId: number, semesterPlanId: number, homeworkId: number, semesterFiles: string[], course: string }> = new Map();
    bot: TelegramBot

    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        // @InjectRepository(StudentHomeworkEntity) private studentHomeworkRepository: Repository<StudentHomeworkEntity>,
        private readonly authService: AuthService,
        // private readonly homeworkService: HomeworkService,
        // private readonly weeklyPlanService: WeeklyPlanService,
    ) {
        
        this.bot = new TelegramBot(process.env.TELEGRAM_API_TOKEN, { polling: true })
    }


    onModuleInit() {
        this.bot.onText(/\/start/, (msg) => this.startManagment(msg.chat.id));
        this.bot.on('callback_query', (query) => this.callbackQueryManagment(query.from.id, query));
        this.bot.onText(/^09\d{9}$/, (msg) => this.phoneNumberManagment(msg.chat.id, msg.text));
        this.bot.onText(/^\d{5}$/, (msg) => this.checkOtpManagment(msg.chat.id, msg.text));
    }

    async startManagment(chatId: number){
        if (!this.userStates.has(chatId)) {
            this.userStates.set(
                chatId,
                {
                    inlineKeyboardMessageId: null, semesterPlanId: null, homeworkId: null, semesterFiles: [], course: null
                }
            );
        }

        const userState = this.userStates?.get(chatId);

        try {
            if (userState?.inlineKeyboardMessageId) {
                await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
                userState.inlineKeyboardMessageId = null
            }
            const user = await this.userRepository.findOneBy({ chatId });        

            if(!user) {
                return this.sendInlineKeyboard(chatId);
            } else if (user && !user.mobile || user.mobileVerified === 0) {
                await this.userRepository.delete({ chatId });
                return this.sendInlineKeyboard(chatId);
            } else {
                const supportUrl = "https://wa.me/+989035369282";
                const message = await this.bot.sendMessage(
                    chatId,
                    "خب حالا یکی از گزینه های زیر رو انتخاب کن:",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: BotMainKeyboard.SemsterPlan, callback_data: BotCallbackData.SemesterPlan },
                                    { text: BotMainKeyboard.WeekHomework, callback_data: BotCallbackData.WeekHomework }
                                ],
                                [{ text: "ارتباط با پشتیبانی", url: supportUrl }]
                            ]
                        }
                    }
                );
                userState.inlineKeyboardMessageId = message.message_id;
            }
        } catch (error) {
            
        }
    }


    async sendInlineKeyboard(chatId: number){
        const userState = this.userStates.get(chatId);
        if (userState?.inlineKeyboardMessageId) {
            // return this.handleStart(chatId)
            await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
            userState.inlineKeyboardMessageId = null
        }

        try {
            const keyboardText = `
            دانشجوی گرامی📚
            متاسفانه شما عضو این ربات نیستید
            با کلیک روی یکی از دکمه های زیر درس خودت رو مشخص کن👇
            `

            const message = await this.bot.sendMessage(chatId, keyboardText, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: ChooseCourseKeyboard.OS, callback_data: ChooseCourseKeyboard.OS },
                            { text: ChooseCourseKeyboard.Programming, callback_data: ChooseCourseKeyboard.Programming }
                        ],
                    ],
                },
            })
            userState.inlineKeyboardMessageId = message.message_id;
        } catch (error) {
            
        }
    }


    async callbackQueryManagment(chatId: number, query: TelegramBot.CallbackQuery) {
        const userState = this.userStates.get(chatId);
        switch (query.data) {
            case ChooseCourseKeyboard.OS: {
                if (userState?.inlineKeyboardMessageId) {
                    // return this.handleStart(chatId)
                    await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
                    userState.inlineKeyboardMessageId = null;
                    userState.course = ChooseCourseCallbackData.OS;                    
                }
                await this.bot.sendMessage(chatId, `حالا شماره ای که باهاش تو کلاس عضو شدی رو با فرمت 09123456789 بفرست🙌` );
                const user = this.userRepository.create({ chatId, course: ChooseCourseCallbackData.OS });
                await this.userRepository.save(user)
                break;
            }
            case ChooseCourseKeyboard.Programming: {
                if (userState?.inlineKeyboardMessageId) {
                    // return this.handleStart(chatId)
                    await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
                    userState.inlineKeyboardMessageId = null;
                    userState.course = ChooseCourseCallbackData.Programming;
                }
                await this.bot.sendMessage(chatId, `حالا شماره ای که باهاش تو کلاس عضو شدی رو با فرمت 09123456789 بفرست🙌` );
                await this.userRepository.insert({ chatId, course: ChooseCourseCallbackData.Programming });
                break;
            }
            case SemsterPlanCallback.ReceiveFiles: {
                if (userState?.inlineKeyboardMessageId) {
                    // return this.handleStart(chatId)
                    await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
                    userState.inlineKeyboardMessageId = null
                }
                await this.sendFilesOfSemester(chatId, userState.semesterFiles)
                break;
            }
            // case SemsterPlanCallback.SendHomework: {
            //     await this.handleSendhomework(chatId)
            //     break;
            // }
            // case BotCallbackData.SendHomeworkRepositoryLink: {
            //     if (userState?.inlineKeyboardMessageId) {
            //         // return this.handleStart(chatId)
            //         await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
            //         userState.inlineKeyboardMessageId = null
            //     }
            //     await this.bot.sendMessage(chatId, "لینک ریپازیتوری پروژه ت رو ارسال کن")
            //     break;
            // }
            case BotCallbackData.SendHomeworkZip: {
                if (userState?.inlineKeyboardMessageId) {
                    // return this.handleStart(chatId)
                    await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
                    userState.inlineKeyboardMessageId = null
                }
                await this.bot.sendMessage(chatId, "فایل پروژه ت رو با فورمت zip ارسال کن")
                break;
            }
            case BotCallbackData.BackToMainMenu: {
                if (userState?.inlineKeyboardMessageId) {
                    await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
                    userState.inlineKeyboardMessageId = null
                }
                await this.startManagment(chatId)
                break;
            }
            // case BotCallbackData.SemesterPlan: {
            //     if (userState?.inlineKeyboardMessageId) {
            //         // return this.handleStart(chatId)
            //         await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
            //         userState.inlineKeyboardMessageId = null
            //     }
            //     await this.weeklyPlanData(query)
            //     break;
            // }
            // case BotCallbackData.WeekHomework: {

            //     if (userState?.inlineKeyboardMessageId) {
            //         await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
            //         userState.inlineKeyboardMessageId = null
            //     }
            //     await this.weekHomeworks(query)
            //     break;
            // }
            // default: {
            //     await this.handleHomeworks(query)
            //     break;
            // }

    
        }
    }

    async phoneNumberManagment(chatId: number, mobile: string) {
        try {
            let user = await this.userRepository.findOneBy({ chatId });
            
            if (!user.course) {
                return this.sendInlineKeyboard(chatId)
            }

            const student = await this.authService.processUserData(user.course, mobile);
            console.log(student);
            
            if (!student) {
                await this.authService.deleteInvalidUserAccount(user.id)
                return this.bot.sendMessage(chatId, 
                    `
                    دانشجوی عزیز متاسفانه نام شما در درس ${user.course} ثبت نشده است.
                    اگر درس خود را اشتباه انتخاب کردید ربات را دوباره /start کنید.
                    در غیر اینصورت به پشتیبانی پیام دهید تا مشکل شما را بررسی کنند.
                    `
                )
            }
            user.fullName = student.fullname;
            user.mobile = student.mobile
            await this.userRepository.save(user);
            const otp = await this.authService.saveOtp(user.id);
            // Send the OTP to the user's phone number
            this.bot.sendMessage(chatId, `کد یکبار مصرف: ${otp.code}`);


        } catch (error) {
            console.log("Error has occured in phone managment section");
            
            this.startManagment(chatId)
        }
    }


    async checkOtpManagment(chatId: number, otp: string){
        const userState = this.userStates?.get(chatId);

        try {
            const res = await this.authService.checkOtp(chatId , otp)
            await this.bot.sendMessage(chatId , res.message)
            await this.startManagment(chatId)
        } catch (error) {
             
        }

    }


    async sendFilesOfSemester(chatId: number, files: string[]){
        const userState = this.userStates.get(chatId);
        if (userState?.inlineKeyboardMessageId) {
            // return this.handleStart(chatId)
            await this.bot.deleteMessage(chatId, userState.inlineKeyboardMessageId);
            userState.inlineKeyboardMessageId = null
        }

        try {
            if (files.length > 0) {
                files.forEach(filePath => {
                    const path = join(process.cwd(), "public", filePath);
                    this.bot.sendDocument(chatId, path)
                        .then(() => {
                            console.log(`File sent: ${filePath}`);
                        })
                        .catch((error) => {
                            console.error(`Error sending file: ${filePath}`, error);
                        });
                })
            } else {
                const supportUrl = "https://wa.me/+989035369282";
                const message = await this.bot.sendMessage(chatId, "هیچ فایلی ضمیمه ی پلن این هفته نشده❌🔗",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: BotMainKeyboard.BackToMainMenu, callback_data: BotCallbackData.BackToMainMenu },
                                    { text: "ارتباط با پشتیبانی", url: supportUrl },
                                ],
                            ]
                        }
                    })
                userState.inlineKeyboardMessageId = message.message_id;
            }
        } 
        catch (error) {
            console.log("Error occured in sendFilesOfPlan", error);
            const supportUrl = "https://wa.me/+989035369282";
            await this.bot.sendMessage(chatId, `
به نظر میاد که یک مشکل سروری رخ داده⚠️
بات رو /start کن و اگر مشکل حل نشد، با پشتیبانی صحبت کن👇
`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "ارتباط با پشتیبانی", url: supportUrl }]
                        ]
                    }
                }
            )
        }

    }




}
