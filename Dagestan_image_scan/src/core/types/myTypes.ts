export type Conf = {
    ip: string,
    port: string | number,
    path: string,
    extensions: string[],
    list_name: string,
    pg_ip: string,
    pg_port: number,
    pg_login: string,
    pg_password: string
}

export type DirScan = {
    dirs: string[],
    files: string[]
}

export type FacePerson = {
    "first_name"?: string,
    "middle_name"?: string,
    "last_name"?: string,
    "notes"?: string,
    "external_id"?: string,
    "list_id": number
}

export type ImageID = {
    "face_id": number
}