import {ContextInterface} from "../../interfaces/services/context.interface";
import {MessageInterface} from "../../interfaces/services/messages.interface";
import {UserInterface} from "../../interfaces/services/userPoolService.interface";
import {MessageSenderInterface} from "../../interfaces/services/messageSender.interface";
import boxen from "boxen";

export class ConsoleMessageSender implements MessageSenderInterface {
    public sendEmail(
        ctx: ContextInterface,
        user: UserInterface,
        destination: string,
        message: MessageInterface
    ): Promise<void> {
        return this.sendToConsole(ctx, user, destination, message);
    }

    public sendSms(
        ctx: ContextInterface,
        user: UserInterface,
        destination: string,
        message: MessageInterface
    ): Promise<void> {
        return this.sendToConsole(ctx, user, destination, message);
    }

    private sendToConsole(
        ctx: ContextInterface,
        user: UserInterface,
        destination: string,
        {__code, ...message}: MessageInterface
    ): Promise<void> {
        const fields = {
            Username: user.Username,
            Destination: destination,
            Code: __code,
            "Email Subject": message.emailSubject,
            "Email Message": message.emailMessage,
            "SMS Message": message.smsMessage,
        };
        const definedFields = Object.entries(fields).filter(
            (kv): kv is [string, string] => !!kv[1]
        );

        let formattedFields = [''];
        if (definedFields !== undefined && definedFields !== null) {
            const longestDefinedFieldName = Math.max(
                ...definedFields.map(([k]) => k.length)
            );
            formattedFields = definedFields.map(
                ([k, v]) => `${(k + ":").padEnd(longestDefinedFieldName + 1)} ${v}`
            );
        }

        ctx.logger.info(
            boxen(`Confirmation Code Delivery\n\n${formattedFields.join("\n")}`, {
                borderStyle: "round" as any,
                borderColor: "yellow",
                padding: 1,
            })
        );

        return Promise.resolve();
    }
}
