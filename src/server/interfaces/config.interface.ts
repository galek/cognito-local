import {FunctionConfig} from "../../services/lambda";
import {KMSConfig} from "../../services/crypto";
import {UserPoolDefaults} from "../../services/userPoolService";
import {TokenConfigInterface} from "../../services/tokenGeneratorInterface";

export interface ConfigInterface {
    LambdaClient: AWS.Lambda.ClientConfiguration;
    TriggerFunctions: FunctionConfig;
    UserPoolDefaults: UserPoolDefaults;
    KMSConfig?: AWS.KMS.ClientConfiguration & KMSConfig;
    TokenConfig: TokenConfigInterface;
}
