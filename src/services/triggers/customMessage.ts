import {AttributeListType} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {CustomMessageTriggerResponse, LambdaInterface} from "../lambda.interface";
import {attributesToRecord} from "../userPoolService.interface";
import {Trigger} from "./trigger";

const AWS_USERNAME_PARAMETER = "{username}";
const AWS_CODE_PARAMETER = "{####}";

interface CustomMessageValue {
    code: string;
    source: | "CustomMessage_SignUp" | "CustomMessage_AdminCreateUser" | "CustomMessage_ResendCode" | "CustomMessage_ForgotPassword" | "CustomMessage_UpdateUserAttribute" | "CustomMessage_VerifyUserAttribute" | "CustomMessage_Authentication";
    userPoolId: string;
    clientId: string | null;
    username: string;
    userAttributes: AttributeListType;

    /**
     * One or more key-value pairs that you can provide as custom input to the Lambda function that you specify for the
     * custom message trigger. You can pass this data to your Lambda function by using the ClientMetadata parameter in the
     * following API actions:
     *
     * - AdminResetUserPassword
     * - AdminRespondToAuthChallenge
     * - AdminUpdateUserAttributes
     * - ForgotPassword
     * - GetUserAttributeVerificationCode
     * - ResendConfirmationCode
     * - SignUp
     * - UpdateUserAttributes
     *
     * Source: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html#cognito-user-pools-lambda-trigger-syntax-custom-message
     */
    clientMetadata: Record<string, string> | undefined;
}

export type CustomMessageTrigger = Trigger<CustomMessageValue, CustomMessageTriggerResponse | null>;

interface CustomMessageServices {
    lambda: LambdaInterface;
}

// it's copy of BaseCustomMessageTriggerEvent.response interface from aws-lambda
export interface BaseCustomMessageResponseInterface {
    smsMessage: string | null;
    emailMessage: string | null;
    emailSubject: string | null
}

export const CustomMessage = ({lambda}: CustomMessageServices): CustomMessageTrigger => async (ctx, {
    clientId, clientMetadata, code, source, userAttributes, username, userPoolId,
}): Promise<BaseCustomMessageResponseInterface | null> => {
    try {
        const response = await lambda.invoke(ctx, "CustomMessage", {
            clientId,
            clientMetadata,
            codeParameter: AWS_CODE_PARAMETER,
            triggerSource: source,
            userAttributes: attributesToRecord(userAttributes),
            username,
            usernameParameter: AWS_USERNAME_PARAMETER,
            userPoolId,
        });

        const emailMessage = response.emailMessage ? response.emailMessage.replace(AWS_CODE_PARAMETER, code)
            .replace(AWS_USERNAME_PARAMETER, username) : null;
        const smsMessage = response.smsMessage ? response.smsMessage.replace(AWS_CODE_PARAMETER, code)
            .replace(AWS_USERNAME_PARAMETER, username) : null;

        return {
            emailMessage, emailSubject: response.emailSubject, smsMessage,
        };
    } catch (ex) {
        ctx.logger.error(ex);
        return null;
    }
};
