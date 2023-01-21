import {ClockInterface} from "../interfaces/services/clock.interface";
import {MessagesInterface} from "../interfaces/services/messages.interface";
import {TokenGeneratorInterface} from "../interfaces/services/tokenGenerator.interface";
import {TriggersInterface} from "./triggers";
import {CognitoService} from "./cognitoService";
import {ConfigInterface} from "../interfaces/server/config.interface";

export {ClockInterface, DateClock} from "../interfaces/services/clock.interface";
export {CognitoService, CognitoServiceImpl} from "./cognitoService";
export {UserPoolServiceInterface, UserPoolServiceImpl} from "../interfaces/services/userPoolService.interface";
export {TriggersInterface, TriggersService} from "./triggers";
export {LambdaInterface, LambdaService} from "../interfaces/services/lambda.interface";
export {MessagesInterface, MessagesService} from "../interfaces/services/messages.interface";

export interface ServicesInterface {
    clock: ClockInterface;
    cognito: CognitoService;
    config: ConfigInterface;
    messages: MessagesInterface;
    otp: () => string;
    tokenGenerator: TokenGeneratorInterface;
    triggers: TriggersInterface;
}
