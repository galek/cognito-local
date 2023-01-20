import {ConfigInterface} from "../server/configInterface";
import {Clock} from "./clock";
import {Messages} from "./messages";
import {TokenGeneratorInterface} from "./tokenGeneratorInterface";
import {Triggers} from "./triggers";
import {CognitoService} from "./cognitoService";

export {Clock, DateClock} from "./clock";
export {CognitoService, CognitoServiceImpl} from "./cognitoService";
export {UserPoolService, UserPoolServiceImpl} from "./userPoolService";
export {Triggers, TriggersService} from "./triggers";
export {Lambda, LambdaService} from "./lambda";
export {Messages, MessagesService} from "./messages";

export interface Services {
    clock: Clock;
    cognito: CognitoService;
    config: ConfigInterface;
    messages: Messages;
    otp: () => string;
    tokenGenerator: TokenGeneratorInterface;
    triggers: Triggers;
}
