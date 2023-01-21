import {AttributeListType} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {LambdaInterface, PreSignUpTriggerResponse} from "../../interfaces/services/lambda.interface";
import {attributesToRecord} from "../../interfaces/services/userPoolService.interface";
import {Trigger} from "./trigger";

export type PreSignUpTrigger = Trigger<{
    clientId: string; source: | "PreSignUp_AdminCreateUser" | "PreSignUp_ExternalProvider" | "PreSignUp_SignUp"; userAttributes: AttributeListType; username: string; userPoolId: string;

    /**
     * One or more name-value pairs containing the validation data in the request to register a user. The validation data
     * is set and then passed from the client in the request to register a user. You can pass this data to your Lambda
     * function by using the ClientMetadata parameter in the InitiateAuth and AdminInitiateAuth API actions.
     *
     * Source: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html#cognito-user-pools-lambda-trigger-syntax-pre-signup
     */
    clientMetadata: Record<string, string> | undefined;

    /**
     * One or more name-value pairs containing the validation data in the request to register a user. The validation data
     * is set and then passed from the client in the request to register a user. You can pass this data to your Lambda
     * function by using the ClientMetadata parameter in the InitiateAuth and AdminInitiateAuth API actions.
     *
     * Source: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html#cognito-user-pools-lambda-trigger-syntax-pre-signup
     */
    validationData: Record<string, string> | undefined;
}, PreSignUpTriggerResponse>;

type PreSignUpServices = {
    lambda: LambdaInterface;
};

export interface PreSignUpResponseInterface {
    autoConfirmUser: boolean;
    autoVerifyEmail: boolean;
    autoVerifyPhone: boolean;
}

export const PreSignUp = ({lambda}: PreSignUpServices): PreSignUpTrigger => async (ctx, {
    clientId, clientMetadata, source, userAttributes, username, userPoolId, validationData,
}): Promise<PreSignUpResponseInterface> => lambda.invoke(ctx, "PreSignUp", {
    clientId,
    clientMetadata,
    triggerSource: source,
    userAttributes: attributesToRecord(userAttributes),
    username,
    userPoolId,
    validationData,
});
