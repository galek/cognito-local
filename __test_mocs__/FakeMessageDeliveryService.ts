import { Context } from "../src/services/context";
import {
  DeliveryDetails,
  MessageDelivery,
} from "../src/services/messageDelivery/messageDelivery";
import { Message } from "../src/services/messages";
import { User } from "../src/services/userPoolService";

interface CollectedMessage {
  readonly deliveryDetails: DeliveryDetails;
  readonly message: Message;
}

export class FakeMessageDeliveryService implements MessageDelivery {
  private readonly messages: CollectedMessage[] = [];

  public get collectedMessages(): readonly CollectedMessage[] {
    return [...this.messages];
  }

  deliver(
    ctx: Context,
    user: User,
    deliveryDetails: DeliveryDetails,
    message: Message
  ): Promise<void> {
    this.messages.push({
      deliveryDetails,
      message,
    });
    return Promise.resolve();
  }
}
