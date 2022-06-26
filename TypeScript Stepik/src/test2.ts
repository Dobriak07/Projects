interface IPaymantAPI {
    getPaymentDetails(id: number): IPaymentDetail | undefined;
}

interface IPaymentDetail {
    id: number;
    sum: number;
}

class PaymentAPI implements IPaymantAPI {
    private data = [{id: 1, sum: 10000}];
    getPaymentDetails(id: number): IPaymentDetail | undefined {
        return this.data.find(d => d.id === id);
    }
    
}

class PaymentAccessProxy implements IPaymantAPI {
    constructor(private api: PaymentAPI, private userId: number) {
        
    }

    getPaymentDetails(id: number): IPaymentDetail | undefined {
        if (this.userId === 1) {
            return this.api.getPaymentDetails(id);
        }
        console.log('Incorrect User');
        return undefined;
    }
}

const proxy = new PaymentAccessProxy(new PaymentAPI(), 1);
console.log(proxy.getPaymentDetails(1));