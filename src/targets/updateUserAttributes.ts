import {
    UpdateUserAttributesRequest,
    UpdateUserAttributesResponse,
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import jwt from "jsonwebtoken";
import {MessagesInterface, ServicesInterface, UserPoolServiceInterface} from "../services";
import {InvalidParameterError, NotAuthorizedError} from "../errors";
import {USER_POOL_AWS_DEFAULTS} from "../services/cognitoService";
import {selectAppropriateDeliveryMethod} from "../services/messageDelivery/deliveryMethod";
import {TokenInterface} from "../interfaces/services/tokenGenerator.interface";
import {
    attributesAppend,
    defaultVerifiedAttributesIfModified,
    hasUnverifiedContactAttributes,
    UserInterface,
    validatePermittedAttributeChanges,
} from "../interfaces/services/userPoolService.interface";
import {Target} from "./Target";
import {ContextInterface} from "../interfaces/services/context.interface";

const sendAttributeVerificationCode = async (
    ctx: ContextInterface,
    userPool: UserPoolServiceInterface,
    user: UserInterface,
    messages: MessagesInterface,
    req: UpdateUserAttributesRequest,
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
    "UpdateUserAttribute",
    null,
    userPool.options.Id,
    user,
    code,
    req.ClientMetadata,
    deliveryDetails
  );

  return deliveryDetails;
};

export type UpdateUserAttributesTarget = Target<
  UpdateUserAttributesRequest,
  UpdateUserAttributesResponse
>;

type UpdateUserAttributesServices = Pick<
  ServicesInterface,
  "clock" | "cognito" | "otp" | "messages"
>;

export const UpdateUserAttributes =
  ({
    clock,
    cognito,
    otp,
    messages,
  }: UpdateUserAttributesServices): UpdateUserAttributesTarget =>
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
      throw new NotAuthorizedError();
    }

    const userAttributesToSet = defaultVerifiedAttributesIfModified(
      validatePermittedAttributeChanges(
        req.UserAttributes,
        // if the user pool doesn't have any SchemaAttributes it was probably created manually
        // or before we started explicitly saving the defaults. Fallback on the AWS defaults in
        // this case, otherwise checks against the schema for default attributes like email will
        // fail.
        userPool.options.SchemaAttributes ??
          USER_POOL_AWS_DEFAULTS.SchemaAttributes ??
          []
      )
    );

    const updatedUser = {
      ...user,
      Attributes: attributesAppend(user.Attributes, ...userAttributesToSet),
      UserLastModifiedDate: clock.get(),
    };

    await userPool.saveUser(ctx, updatedUser);

    // deliberately only check the affected user attributes, not the combined attributes
    // e.g. a user with email_verified=false that you don't touch the email attributes won't get notified
    if (
      userPool.options.AutoVerifiedAttributes?.length &&
      hasUnverifiedContactAttributes(userAttributesToSet)
    ) {
      const code = otp();

      await userPool.saveUser(ctx, {
        ...updatedUser,
        AttributeVerificationCode: code,
      });

      const deliveryDetails = await sendAttributeVerificationCode(
        ctx,
        userPool,
        user,
        messages,
        req,
        code
      );

      return {
        CodeDeliveryDetailsList: [deliveryDetails],
      };
    }

    return {
      CodeDeliveryDetailsList: [],
    };
  };
