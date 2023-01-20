import {ClockInterface} from "./clock.interface";
import {MessagesInterface} from "./messages.interface";
import {TokenGeneratorInterface} from "./tokenGenerator.interface";
import {TriggersInterface} from "./triggers";
import {CognitoService} from "./cognitoService";
import {ConfigInterface} from "../server/interfaces/config.interface";

export {ClockInterface, DateClock} from "./clock.interface";
export {CognitoService, CognitoServiceImpl} from "./cognitoService";
export {UserPoolServiceInterface, UserPoolServiceImpl} from "./userPoolService.interface";
export {TriggersInterface, TriggersService} from "./triggers";
export {LambdaInterface, LambdaService} from "./lambda.interface";
export {MessagesInterface, MessagesService} from "./messages.interface";

export interface ServicesInterface {
    clock: ClockInterface;
    cognito: CognitoService;
    config: ConfigInterface;
    messages: MessagesInterface;
    otp: () => string;
    tokenGenerator: TokenGeneratorInterface;
    triggers: TriggersInterface;
}
