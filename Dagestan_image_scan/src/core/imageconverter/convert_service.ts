import * as _gm from 'gm';
const gm = _gm.subClass({imageMagick: true});

export function gmConvert(buf: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        // console.log(buf);
        gm(buf).toBuffer('jpg', (err, buffer) => {
            if (err) reject(err)
            resolve(buffer);
        })
    })
}