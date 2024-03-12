export interface CouponValueData {
    name: string;
    type: string;
    discount: number;
}

export const couponValue: CouponValueData[] = [
    {
        name: "5% OFF",
        type: "1",
        discount: 5
    },
    {
        name: "10% OFF",
        type: "2",
        discount: 10
    },
    {
        name: "20% OFF",
        type: "3",
        discount: 20
    },
    {
        name: "30% OFF",
        type: "4",
        discount: 30
    },
    {
        name: "40% OFF",
        type: "5",
        discount: 40
    }
];