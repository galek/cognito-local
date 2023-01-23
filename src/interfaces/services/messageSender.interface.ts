import {ContextInterface} from "./context.interface";
import {MessageInterface} from "./messages.interface";
import {UserInterface} from "./userPoolService.interface";

export interface MessageSenderInterface {
    sendEmail(
        ctx: ContextInterface,
        user: UserInterface,
        destination: string,
        message: MessageInterface
    ): Promise<void>;

    sendSms(
        ctx: ContextInterface,
        user: UserInterface,
        destination: string,
        message: MessageInterface
    ): Promise<void>;
}
