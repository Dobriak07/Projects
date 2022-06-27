export type Conf = {
    ip: string,
    port: string | number,
    path: string,
    extensions: string[],
    list_name: string
}

export type DirScan = {
    dirs: string[],
    files: string[]
}