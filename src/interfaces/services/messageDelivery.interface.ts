import {ContextInterface} from "./context.interface";
import {MessageInterface} from "./messages.interface";
import {UserInterface} from "./userPoolService.interface";
import {MessageSenderInterface} from "./messageSender.interface";

export type DeliveryDetails =
    | {
    AttributeName: "email";
    DeliveryMedium: "EMAIL";
    Destination: string;
}
    | {
    AttributeName: "phone_number";
    DeliveryMedium: "SMS";
    Destination: string;
};

export interface MessageDeliveryInterface {
    deliver(
        ctx: ContextInterface,
        user: UserInterface,
        deliveryDetails: DeliveryDetails,
        message: MessageInterface
    ): Promise<void>;
}

export class MessageDeliveryService implements MessageDeliveryInterface {
    private readonly sender: MessageSenderInterface;

    public constructor(sender: MessageSenderInterface) {
        this.sender = sender;
    }

    public async deliver(
        ctx: ContextInterface,
        user: UserInterface,
        deliveryDetails: DeliveryDetails,
        message: MessageInterface
    ): Promise<void> {
        if (deliveryDetails.DeliveryMedium === "SMS") {
            await this.sender.sendSms(
                ctx,
                user,
                deliveryDetails.Destination,
                message
            );
        } else if (deliveryDetails.DeliveryMedium === "EMAIL") {
            await this.sender.sendEmail(
                ctx,
                user,
                deliveryDetails.Destination,
                message
            );
        }
    }
}
