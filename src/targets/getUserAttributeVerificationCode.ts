import {
    GetUserAttributeVerificationCodeRequest,
    GetUserAttributeVerificationCodeResponse,
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import jwt from "jsonwebtoken";
import {MessagesInterface, ServicesInterface, UserPoolServiceInterface} from "../services";
import {InvalidParameterError, UserNotFoundError} from "../errors";
import {selectAppropriateDeliveryMethod} from "../services/messageDelivery/deliveryMethod";
import {TokenInterface} from "../services/tokenGenerator.interface";
import {UserInterface} from "../services/userPoolService.interface";
import {Target} from "./Target";
import {ContextInterface} from "../services/context.interface";

const sendAttributeVerificationCode = async (
    ctx: ContextInterface,
    userPool: UserPoolServiceInterface,
    user: UserInterface,
    messages: MessagesInterface,
    req: GetUserAttributeVerificationCodeRequest,
    code: string
) => {
    const deliveryDetails = selectAppropriateDeliveryMethod(
    userPool.options.AutoVerifiedAttributes ?? [],
    user
  );
  if (!deliveryDetails) {
    // TODO: I don't know what the real error message should be for this
    throw new InvalidParameterError(
      "User has no attribute matching desired auto verified attributes"
    );
  }

  await messages.deliver(
    ctx,
    "VerifyUserAttribute",
    null,
    userPool.options.Id,
    user,
    code,
    req.ClientMetadata,
    deliveryDetails
  );
};

export type GetUserAttributeVerificationCodeTarget = Target<
  GetUserAttributeVerificationCodeRequest,
  GetUserAttributeVerificationCodeResponse
>;

type GetUserAttributeVerificationCodeServices = Pick<
  ServicesInterface,
  "cognito" | "otp" | "messages"
>;

export const GetUserAttributeVerificationCode =
  ({
    cognito,
    otp,
    messages,
  }: GetUserAttributeVerificationCodeServices): GetUserAttributeVerificationCodeTarget =>
  async (ctx, req) => {
      const decodedToken = jwt.decode(req.AccessToken) as TokenInterface | null;
    if (!decodedToken) {
      ctx.logger.info("Unable to decode token");
      throw new InvalidParameterError();
    }

    const userPool = await cognito.getUserPoolForClientId(
      ctx,
      decodedToken.client_id
    );
    const user = await userPool.getUserByUsername(ctx, decodedToken.sub);
    if (!user) {
      throw new UserNotFoundError();
    }

    const code = otp();

    await userPool.saveUser(ctx, {
      ...user,
      AttributeVerificationCode: code,
    });

    await sendAttributeVerificationCode(
      ctx,
      userPool,
      user,
      messages,
      req,
      code
    );

    return {};
  };
