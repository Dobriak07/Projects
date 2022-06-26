interface ILength {
    length: number;
}

function count<T extends ILength>(num: T) {
    return num.length + 1;
}
