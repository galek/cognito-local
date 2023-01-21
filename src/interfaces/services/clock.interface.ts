export interface ClockInterface {
    get(): Date;
}

export class DateClock implements ClockInterface {
    get(): Date {
        return new Date();
    }
}
