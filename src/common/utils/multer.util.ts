import { BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname, join } from "path";

export type MulterFile = Express.Multer.File;
export type DestinationCallback = (error: Error, destination: string) => void
export type FileNameCallback = (error: Error, filename: string) => void

export function multerDestination(fieldname: string){
    return function (req: Request , file: MulterFile, callback: DestinationCallback ) : void {
        let path = join("public" , "uploads" , fieldname)
        mkdirSync(path , {recursive : true})
        callback(null , path)
    }
}

export function multerFileName(req: Request , file: MulterFile, callback: FileNameCallback ) : void {
    const ext = extname(file.originalname).toLowerCase()
    if(!fileFormatValidation(ext)){
        callback(new BadRequestException("Invalid Format❌") , null)
    } else {
        const filename = `${Date.now()}${ext}`
        callback(null , filename)
    }
}

function fileFormatValidation(ext: string){
    return [".jpg", ".gif", ".jpeg", ".png", ".zip", ".rar", ".txt", ".docx", ".pdf"].includes(ext)
}

export function multerStorage(folderName: string){
    return diskStorage({
        destination : multerDestination(folderName) ,
        filename : multerFileName ,
      })
}