export interface IFlightStatusStats {
    total: number;
    monthly: {
        month: string;
        amount: number;
    }[];
}
