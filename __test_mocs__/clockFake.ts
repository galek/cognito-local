import { ClockInterface } from "../src/services";

export class ClockFake implements ClockInterface {
  private currentValue: Date;

  constructor(initialValue: Date) {
    this.currentValue = initialValue;
  }

  public get(): Date {
    return this.currentValue;
  }

  public advanceBy(ms: number): Date {
    this.currentValue = new Date(this.currentValue.getTime() + ms);
    return this.currentValue;
  }

  public advanceTo(date: Date): Date {
    this.currentValue = date;
    return this.currentValue;
  }
}
