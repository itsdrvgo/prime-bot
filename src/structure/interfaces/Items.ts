export interface Items {
    name: string;
    id: number;
    type: "normal" | "custom";
    price: number;
    description: string;
    file?: string;
    link?: string;
    thumbnail?: string;
}