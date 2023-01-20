import { ContextInterface } from "../src/services/contextInterface";
import {
  DeliveryDetails,
  MessageDeliveryInterface,
} from "../src/services/messageDelivery/messageDeliveryInterface";
import { MessageInterface } from "../src/services/messagesInterface";
import { UserInterface } from "../src/services/userPoolServiceInterface";

interface CollectedMessage {
  readonly deliveryDetails: DeliveryDetails;
  readonly message: MessageInterface;
}

export class FakeMessageDeliveryService implements MessageDeliveryInterface {
  private readonly messages: CollectedMessage[] = [];

  public get collectedMessages(): readonly CollectedMessage[] {
    return [...this.messages];
  }

  deliver(
    ctx: ContextInterface,
    user: UserInterface,
    deliveryDetails: DeliveryDetails,
    message: MessageInterface
  ): Promise<void> {
    this.messages.push({
      deliveryDetails,
      message,
    });
    return Promise.resolve();
  }
}
