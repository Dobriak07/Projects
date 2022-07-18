import fs from "fs";

export class FileService {
    isExist(path: string) {
        try {
            fs.statSync(path);
            return true;
        }
        catch(err) {
            return false;
        }
    }

    writeFile(path: string, data: string) {
        try{
            fs.writeFileSync(path, data);
        }
        catch(err) {
            throw err;
        }
    }
}