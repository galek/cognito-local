import {ContextInterface} from "./context.interface";
import {DeliveryDetails, MessageDeliveryInterface,} from "./messageDelivery/messageDelivery.interface";
import {TriggersInterface} from "./triggers";
import {UserInterface} from "./userPoolService.interface";

const AWS_ADMIN_CLIENT_ID = "CLIENT_ID_NOT_APPLICABLE";

export interface MessageInterface {
    __code?: string; // not really part of the message, but we pass it around for convenience logging to the console
    emailMessage?: string | null;
    emailSubject?: string | null;
    smsMessage?: string | null;
}

type MessageSource =
    | "AdminCreateUser"
    | "Authentication"
    | "ForgotPassword"
    | "ResendCode"
    | "SignUp"
    | "UpdateUserAttribute"
    | "VerifyUserAttribute";

export interface MessagesInterface {
    deliver(
        ctx: ContextInterface,
        source: MessageSource,
        clientId: string | null,
        userPoolId: string,
        user: UserInterface,
        code: string,
        clientMetadata: Record<string, string> | undefined,
        deliveryDetails: DeliveryDetails
    ): Promise<void>;
}

export class MessagesService implements MessagesInterface {
    private readonly triggers: TriggersInterface;
    private readonly messageDelivery: MessageDeliveryInterface;

    public constructor(triggers: TriggersInterface, messageDelivery: MessageDeliveryInterface) {
        this.triggers = triggers;
        this.messageDelivery = messageDelivery;
    }

    public async deliver(
        ctx: ContextInterface,
        source: MessageSource,
        clientId: string | null,
        userPoolId: string,
        user: UserInterface,
        code: string,
        clientMetadata: Record<string, string> | undefined,
        deliveryDetails: DeliveryDetails
    ): Promise<void> {
        if (
            this.triggers.enabled("CustomEmailSender") &&
            source !== "Authentication"
        ) {
            return this.customDelivery(
                ctx,
                source,
                clientId,
                userPoolId,
                user,
                code,
                clientMetadata
            );
        }

        const message = await this.create(
            ctx,
            source,
            clientId,
            userPoolId,
            user,
            code,
            clientMetadata
        );

        await this.messageDelivery.deliver(ctx, user, deliveryDetails, message);
    }

    private async create(
        ctx: ContextInterface,
        source: MessageSource,
        clientId: string | null,
        userPoolId: string,
        user: UserInterface,
        code: string,
        clientMetadata: Record<string, string> | undefined
    ): Promise<MessageInterface> {
        if (this.triggers.enabled("CustomMessage")) {
            const message = await this.triggers.customMessage(ctx, {
                clientId: clientId ?? AWS_ADMIN_CLIENT_ID,
                clientMetadata,
                code,
                source: `CustomMessage_${source}`,
                userAttributes: user.Attributes,
                username: user.Username,
                userPoolId,
            });

            return {
                __code: code,
                ...message,
            };
        }

        // TODO: What should the default message be?
        return {
            __code: code,
        };
    }

    private async customDelivery(
        ctx: ContextInterface,
        source: Exclude<MessageSource, "Authentication">,
        clientId: string | null,
        userPoolId: string,
        user: UserInterface,
        code: string,
        clientMetadata: Record<string, string> | undefined
    ): Promise<void> {
        await this.triggers.customEmailSender(ctx, {
            clientId: clientId ?? AWS_ADMIN_CLIENT_ID,
            clientMetadata,
            code,
            source: `CustomEmailSender_${source}`,
            userAttributes: user.Attributes,
            username: user.Username,
            userPoolId,
        });
    }
}
