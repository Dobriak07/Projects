import { Pool } from "pg";

export async function pgLog(results: Map<string, any>, pool: Pool | undefined) {
    try {
        let errStatus = ['no_face', 'upload_problem'];
        // @ts-ignore-start
        for (const [key, value] of results) {
            if (errStatus.includes(value.status)) {
                let res = await pool?.query(
                    `INSERT INTO log (file, path, date, status, success_info, error_info) VALUES ($1, $2, $3, $4, $5, $6);`, 
                    [value.file, value.path, (new Date()).toISOString(), value.code, JSON.stringify(value), value.status]
                );
                results.delete(key);
            } else {
                let res = await pool?.query(
                    `INSERT INTO log (file, path, date, status, success_info) VALUES ($1, $2, $3, $4, $5);`, 
                    [value.file, value.path, (new Date()).toISOString(), value.code, JSON.stringify(value)]
                );
                results.delete(key);
            }
        }
        // @ts-ignore-stop
    }
    catch(e) {
        if (results.size != 0) {
            await pgLog(results, pool);
        }
        console.log(e);
    }
}