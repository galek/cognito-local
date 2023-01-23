import {ClockInterface} from "./clock.interface";
import {CognitoService} from "../../services/cognitoService";
import {CryptoService} from "../../services/crypto";
import {LambdaInterface} from "./lambda.interface";
import {CustomEmailSender, CustomEmailSenderTrigger,} from "../../services/triggers/customEmailSender";
import {CustomMessage, CustomMessageTrigger} from "../../services/triggers/customMessage";
import {PostAuthentication, PostAuthenticationTrigger,} from "../../services/triggers/postAuthentication";
import {PostConfirmation, PostConfirmationTrigger} from "../../services/triggers/postConfirmation";
import {PreSignUp, PreSignUpTrigger} from "../../services/triggers/preSignUp";
import {PreTokenGeneration, PreTokenGenerationTrigger,} from "../../services/triggers/preTokenGeneration";
import {UserMigration, UserMigrationTrigger} from "../../services/triggers/userMigration";

type SupportedTriggers =
    | "CustomEmailSender"
    | "CustomMessage"
    | "UserMigration"
    | "PostAuthentication"
    | "PostConfirmation"
    | "PreSignUp"
    | "PreTokenGeneration";

export interface TriggersInterface {
    customMessage: CustomMessageTrigger;
    customEmailSender: CustomEmailSenderTrigger;
    postAuthentication: PostAuthenticationTrigger;
    postConfirmation: PostConfirmationTrigger;
    preSignUp: PreSignUpTrigger;
    preTokenGeneration: PreTokenGenerationTrigger;
    userMigration: UserMigrationTrigger;

    enabled(trigger: SupportedTriggers): boolean;
}

export class TriggersService implements TriggersInterface {
    public readonly customMessage: CustomMessageTrigger;
    public readonly customEmailSender: CustomEmailSenderTrigger;
    public readonly postAuthentication: PostAuthenticationTrigger;
    public readonly postConfirmation: PostConfirmationTrigger;
    public readonly preSignUp: PreSignUpTrigger;
    public readonly preTokenGeneration: PreTokenGenerationTrigger;
    public readonly userMigration: UserMigrationTrigger;
    private readonly lambda: LambdaInterface;

    public constructor(
        clock: ClockInterface,
        cognitoClient: CognitoService,
        lambda: LambdaInterface,
        crypto: CryptoService
    ) {
        this.lambda = lambda;

        this.customEmailSender = CustomEmailSender({lambda, crypto});
        this.customMessage = CustomMessage({lambda});
        this.postAuthentication = PostAuthentication({lambda});
        this.postConfirmation = PostConfirmation({lambda});
        this.preSignUp = PreSignUp({lambda});
        this.preTokenGeneration = PreTokenGeneration({lambda});
        this.userMigration = UserMigration({clock, lambda, cognitoClient});
    }

    public enabled(trigger: SupportedTriggers): boolean {
        return this.lambda.enabled(trigger);
    }
}
