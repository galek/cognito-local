import {
    CreateAuthChallengeTriggerEvent,
    CustomEmailSenderTriggerEvent,
    CustomMessageTriggerEvent,
    DefineAuthChallengeTriggerEvent,
    PostAuthenticationTriggerEvent,
    PostConfirmationTriggerEvent,
    PreAuthenticationTriggerEvent,
    PreSignUpTriggerEvent,
    PreTokenGenerationTriggerEvent,
    UserMigrationTriggerEvent,
    VerifyAuthChallengeResponseTriggerEvent,
} from "aws-lambda";
import type {Lambda as LambdaClient} from "aws-sdk";
import {InvocationResponse} from "aws-sdk/clients/lambda";
import {version as awsSdkVersion} from "aws-sdk/package.json";
import {InvalidLambdaResponseError, UnexpectedLambdaExceptionError, UserLambdaValidationError,} from "../errors";
import {ContextInterface} from "./context.interface";

type CognitoUserPoolEvent =
    | CreateAuthChallengeTriggerEvent
    | CustomEmailSenderTriggerEvent
    | CustomMessageTriggerEvent
    | DefineAuthChallengeTriggerEvent
    | PostAuthenticationTriggerEvent
    | PostConfirmationTriggerEvent
    | PreAuthenticationTriggerEvent
    | PreSignUpTriggerEvent
    | PreTokenGenerationTriggerEvent
    | UserMigrationTriggerEvent
    | VerifyAuthChallengeResponseTriggerEvent;

export interface EventCommonParametersInterface {
    clientId: string;
    userAttributes: Record<string, string>;
    username: string;
    userPoolId: string;
}

export interface CustomEmailSenderEventInterface extends Omit<EventCommonParametersInterface, "clientId"> {
    clientId: string | null;
    code: string;
    clientMetadata: Record<string, string> | undefined;
    triggerSource: | "CustomEmailSender_AdminCreateUser" | "CustomEmailSender_ForgotPassword" | "CustomEmailSender_ResendCode" | "CustomEmailSender_SignUp" | "CustomEmailSender_UpdateUserAttribute" | "CustomEmailSender_VerifyUserAttribute";
}

export interface CustomMessageEventInterface extends Omit<EventCommonParametersInterface, "clientId"> {
    clientId: string | null;
    clientMetadata: Record<string, string> | undefined;
    codeParameter: string;
    // TODO: Nick: Remove | symbol
    triggerSource: | "CustomMessage_AdminCreateUser" | "CustomMessage_Authentication" | "CustomMessage_ForgotPassword" | "CustomMessage_ResendCode" | "CustomMessage_SignUp" | "CustomMessage_UpdateUserAttribute" | "CustomMessage_VerifyUserAttribute";
    usernameParameter: string;
}

export interface UserMigrationEventInterface extends EventCommonParametersInterface {
    clientMetadata: Record<string, string> | undefined;
    password: string;
    triggerSource: "UserMigration_Authentication";
    validationData: Record<string, string> | undefined;
}

export interface PreSignUpEventInterface extends EventCommonParametersInterface {
    clientMetadata: Record<string, string> | undefined;
    // TODO: Nick: Remove | symbol
    triggerSource: | "PreSignUp_AdminCreateUser" | "PreSignUp_ExternalProvider" | "PreSignUp_SignUp";
    validationData: Record<string, string> | undefined;
}

export interface PreTokenGenerationEventInterface extends EventCommonParametersInterface {
    /**
     * One or more key-value pairs that you can provide as custom input to the Lambda function that you specify for the
     * pre token generation trigger. You can pass this data to your Lambda function by using the ClientMetadata parameter
     * in the AdminRespondToAuthChallenge and RespondToAuthChallenge API actions.
     */
    clientMetadata: Record<string, string> | undefined;

    // TODO: Nick: Remove | symbol
    triggerSource: | "TokenGeneration_AuthenticateDevice" | "TokenGeneration_Authentication" | "TokenGeneration_HostedAuth" | "TokenGeneration_NewPasswordChallenge" | "TokenGeneration_RefreshTokens";

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
}

export interface PostAuthenticationEventInterface extends EventCommonParametersInterface {
    clientMetadata: Record<string, string> | undefined;
    triggerSource: "PostAuthentication_Authentication";
}

export interface PostConfirmationEventInterface extends Omit<EventCommonParametersInterface, "clientId"> {
    // TODO: Nick: Remove | symbol
    triggerSource: | "PostConfirmation_ConfirmSignUp" | "PostConfirmation_ConfirmForgotPassword";
    clientMetadata: Record<string, string> | undefined;
    clientId: string | null;
}

export interface FunctionConfigInterface {
    CustomMessage?: string;
    PostAuthentication?: string;
    PostConfirmation?: string;
    PreSignUp?: string;
    PreTokenGeneration?: string;
    UserMigration?: string;
    CustomEmailSender?: string;
}

export type CustomMessageTriggerResponse = CustomMessageTriggerEvent["response"];
export type UserMigrationTriggerResponse = UserMigrationTriggerEvent["response"];
export type PreSignUpTriggerResponse = PreSignUpTriggerEvent["response"];
export type PreTokenGenerationTriggerResponse = PreTokenGenerationTriggerEvent["response"];
export type PostAuthenticationTriggerResponse = PostAuthenticationTriggerEvent["response"];
export type PostConfirmationTriggerResponse = PostConfirmationTriggerEvent["response"];
export type CustomEmailSenderTriggerResponse = CustomEmailSenderTriggerEvent["response"];

export interface LambdaInterface {
    enabled(lambda: keyof FunctionConfigInterface): boolean;

    invoke(ctx: ContextInterface, lambda: "CustomMessage", event: CustomMessageEventInterface): Promise<CustomMessageTriggerResponse>;

    invoke(ctx: ContextInterface, lambda: "UserMigration", event: UserMigrationEventInterface): Promise<UserMigrationTriggerResponse>;

    invoke(ctx: ContextInterface, lambda: "PreSignUp", event: PreSignUpEventInterface): Promise<PreSignUpTriggerResponse>;

    invoke(ctx: ContextInterface, lambda: "PreTokenGeneration", event: PreTokenGenerationEventInterface): Promise<PreTokenGenerationTriggerResponse>;

    invoke(ctx: ContextInterface, lambda: "PostAuthentication", event: PostAuthenticationEventInterface): Promise<PostAuthenticationTriggerResponse>;

    invoke(ctx: ContextInterface, lambda: "PostConfirmation", event: PostConfirmationEventInterface): Promise<PostConfirmationTriggerResponse>;

    invoke(ctx: ContextInterface, lambda: "CustomEmailSender", event: CustomEmailSenderEventInterface): Promise<CustomEmailSenderTriggerResponse>;
}

export class LambdaService implements LambdaInterface {
    private readonly config: FunctionConfigInterface;
    private readonly lambdaClient: LambdaClient;

    public constructor(config: FunctionConfigInterface, lambdaClient: LambdaClient) {
        this.config = config;
        this.lambdaClient = lambdaClient;
    }

    public enabled(lambda: keyof FunctionConfigInterface): boolean {
        return !!this.config[lambda];
    }

    public async invoke(ctx: ContextInterface, trigger: keyof FunctionConfigInterface, event: | CustomMessageEventInterface | CustomEmailSenderEventInterface | PostAuthenticationEventInterface | PostConfirmationEventInterface | PreSignUpEventInterface | PreTokenGenerationEventInterface | UserMigrationEventInterface) {
        const functionName = this.config[trigger];
        if (!functionName) {
            throw new Error(`${trigger} trigger not configured`);
        }

        const lambdaEvent = this.createLambdaEvent(event);

        ctx.logger.debug({
            functionName, event: JSON.stringify(lambdaEvent, undefined, 2),
        }, `Invoking "${functionName}" with event`);
        let result: InvocationResponse;
        try {
            result = await this.lambdaClient
                .invoke({
                    FunctionName: functionName, InvocationType: "RequestResponse", Payload: JSON.stringify(lambdaEvent),
                })
                .promise();
        } catch (ex) {
            ctx.logger.error(ex);
            throw new UnexpectedLambdaExceptionError();
        }

        ctx.logger.debug(`Lambda completed with StatusCode=${result.StatusCode} and FunctionError=${result.FunctionError}`);
        if (result.StatusCode === 200) {
            try {
                const parsedPayload = JSON.parse(result.Payload as string);

                return parsedPayload.response;
            } catch (err) {
                ctx.logger.error(err);
                throw new InvalidLambdaResponseError();
            }
        } else {
            ctx.logger.error(result.FunctionError);
            throw new UserLambdaValidationError(result.FunctionError);
        }
    }

    private createLambdaEvent(event: | CustomMessageEventInterface | CustomEmailSenderEventInterface | PostAuthenticationEventInterface | PostConfirmationEventInterface | PreSignUpEventInterface | PreTokenGenerationEventInterface | UserMigrationEventInterface): CognitoUserPoolEvent {
        const version = "0"; // TODO: how do we know what this is?
        const callerContext = {
            awsSdkVersion,

            // client id can be null, even though the types don't allow it
            clientId: event.clientId as string,
        };
        const region = "local"; // TODO: pull from above,

        switch (event.triggerSource) {
            case "PostAuthentication_Authentication": {
                return {
                    version,
                    callerContext,
                    region,
                    userPoolId: event.userPoolId,
                    triggerSource: event.triggerSource,
                    userName: event.username,
                    request: {
                        userAttributes: event.userAttributes,
                        clientMetadata: event.clientMetadata,
                        newDeviceUsed: false,
                    },
                    response: {},
                };
            }

            case "PostConfirmation_ConfirmForgotPassword":
            case "PostConfirmation_ConfirmSignUp": {
                return {
                    version,
                    callerContext,
                    region,
                    userPoolId: event.userPoolId,
                    triggerSource: event.triggerSource,
                    userName: event.username,
                    request: {
                        userAttributes: event.userAttributes, clientMetadata: event.clientMetadata,
                    },
                    response: {},
                };
            }

            case "PreSignUp_AdminCreateUser":
            case "PreSignUp_ExternalProvider":
            case "PreSignUp_SignUp": {
                return {
                    version,
                    callerContext,
                    region,
                    userPoolId: event.userPoolId,
                    triggerSource: event.triggerSource,
                    userName: event.username,
                    request: {
                        userAttributes: event.userAttributes,
                        clientMetadata: event.clientMetadata,
                        validationData: event.validationData,
                    },
                    response: {
                        autoConfirmUser: false, autoVerifyEmail: false, autoVerifyPhone: false,
                    },
                };
            }

            case "TokenGeneration_AuthenticateDevice":
            case "TokenGeneration_Authentication":
            case "TokenGeneration_HostedAuth":
            case "TokenGeneration_NewPasswordChallenge":
            case "TokenGeneration_RefreshTokens": {
                return {
                    version,
                    callerContext,
                    region,
                    userPoolId: event.userPoolId,
                    triggerSource: event.triggerSource,
                    userName: event.username,
                    request: {
                        userAttributes: event.userAttributes,
                        groupConfiguration: {},
                        clientMetadata: event.clientMetadata,
                    },
                    response: {
                        claimsOverrideDetails: {},
                    },
                };
            }

            case "UserMigration_Authentication": {
                return {
                    version,
                    callerContext,
                    region,
                    userPoolId: event.userPoolId,
                    triggerSource: event.triggerSource,
                    userName: event.username,
                    request: {
                        clientMetadata: event.clientMetadata,
                        password: event.password,
                        validationData: event.validationData,
                    },
                    response: {
                        desiredDeliveryMediums: [],
                        finalUserStatus: undefined,
                        forceAliasCreation: undefined,
                        messageAction: undefined,
                        userAttributes: {},
                    },
                };
            }

            case "CustomMessage_SignUp":
            case "CustomMessage_AdminCreateUser":
            case "CustomMessage_ResendCode":
            case "CustomMessage_ForgotPassword":
            case "CustomMessage_UpdateUserAttribute":
            case "CustomMessage_VerifyUserAttribute":
            case "CustomMessage_Authentication": {
                const tmp: CognitoUserPoolEvent = {} as CognitoUserPoolEvent;
                tmp.version = version;
                tmp.callerContext = callerContext;
                tmp.region = region;
                tmp.userPoolId = event.userPoolId;
                tmp.triggerSource = event.triggerSource;
                tmp.userName = event.username;
                tmp.request = {
                    clientMetadata: event.clientMetadata,
                    codeParameter: event.codeParameter,
                    usernameParameter: event.usernameParameter,
                    userAttributes: event.userAttributes,
                };
                tmp.response = {
                    smsMessage: "", emailMessage: "", emailSubject: "",
                };

                return tmp;
            }

            case "CustomEmailSender_SignUp":
            case "CustomEmailSender_ResendCode":
            case "CustomEmailSender_ForgotPassword":
            case "CustomEmailSender_UpdateUserAttribute":
            case "CustomEmailSender_VerifyUserAttribute":
            case "CustomEmailSender_AdminCreateUser":
                return {
                    version,
                    region,
                    userPoolId: event.userPoolId,
                    triggerSource: event.triggerSource,
                    userName: event.username,
                    callerContext,
                    request: {
                        type: "customEmailSenderRequestV1",
                        code: event.code,
                        userAttributes: event.userAttributes,
                        clientMetadata: event.clientMetadata,
                    },
                    response: {},
                };
            default: {
                throw new Error("Unsupported Trigger Source");
            }
        }
    }
}
