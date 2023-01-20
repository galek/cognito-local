import {AttributeListType} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {LambdaInterface, PreTokenGenerationTriggerResponse} from "../lambda.interface";
import {attributesToRecord} from "../userPoolService.interface";
import {Trigger} from "./trigger";
import {StringMap} from "aws-sdk/clients/ecs";
import {GroupOverrideDetails} from "aws-lambda/trigger/cognito-user-pool-trigger/pre-token-generation";

export type Source =
    | "AuthenticateDevice"
    | "Authentication"
    | "HostedAuth"
    | "NewPasswordChallenge"
    | "RefreshTokens";

export type PreTokenGenerationTrigger = Trigger<{
    clientId: string; userAttributes: AttributeListType; username: string; userPoolId: string;

    /**
     * One or more key-value pairs that you can provide as custom input to the Lambda function that you specify for the
     * pre token generation trigger. You can pass this data to your Lambda function by using the ClientMetadata
     * parameter in the AdminRespondToAuthChallenge and RespondToAuthChallenge API actions.
     *
     * Source: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html#cognito-user-pools-lambda-trigger-syntax-pre-token-generation
     */
    clientMetadata: Record<string, string> | undefined;

    source: Source;

    /**
     * The input object containing the current group configuration. It includes groupsToOverride, iamRolesToOverride, and
     * preferredRole.
     */
    groupConfiguration: {
        /**
         * A list of the group names that are associated with the user that the identity token is issued for.
         */
        groupsToOverride: readonly string[] | undefined;

        /**
         * A list of the current IAM roles associated with these groups.
         */
        iamRolesToOverride: readonly string[] | undefined;

        /**
         * A string indicating the preferred IAM role.
         */
        preferredRole: string | undefined;
    };
}, PreTokenGenerationTriggerResponse>;

type PreTokenGenerationServices = {
    lambda: LambdaInterface;
};

export interface PreTokenGenerationResponseInterface {
    claimsOverrideDetails: {
        claimsToAddOrOverride?: StringMap | undefined, claimsToSuppress?: string[] | undefined,
        groupOverrideDetails?: GroupOverrideDetails | undefined
    }
}

export const PreTokenGeneration = ({lambda}: PreTokenGenerationServices): PreTokenGenerationTrigger =>
    async (ctx, {
    clientId, clientMetadata, groupConfiguration, source, userAttributes, username, userPoolId,
}): Promise<PreTokenGenerationResponseInterface> => lambda.invoke(ctx, "PreTokenGeneration", {
    clientId,
    clientMetadata,
    groupConfiguration,
    triggerSource: `TokenGeneration_${source}`,
    userAttributes: attributesToRecord(userAttributes),
    username,
    userPoolId,
});
