import {FunctionConfigInterface} from "../../services/lambda.interface";
import {KMSConfigInterface} from "../../services/crypto";
import {UserPoolDefaults} from "../../services/userPoolService.interface";
import {TokenConfigInterface} from "../../services/tokenGenerator.interface";

export interface ConfigInterface {
    LambdaClient: AWS.Lambda.ClientConfiguration;
    TriggerFunctions: FunctionConfigInterface;
    UserPoolDefaults: UserPoolDefaults;
    KMSConfig?: AWS.KMS.ClientConfiguration & KMSConfigInterface;
    TokenConfig: TokenConfigInterface;
}
