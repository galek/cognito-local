import {
    AdminUpdateUserAttributesRequest,
    AdminUpdateUserAttributesResponse,
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {InvalidParameterError, NotAuthorizedError} from "../errors";
import {MessagesInterface, ServicesInterface, UserPoolServiceInterface} from "../services";
import {USER_POOL_AWS_DEFAULTS} from "../services/cognitoService";
import {selectAppropriateDeliveryMethod} from "../services/messageDelivery/deliveryMethod";
import {
    attributesAppend,
    defaultVerifiedAttributesIfModified,
    hasUnverifiedContactAttributes,
    UserInterface,
    validatePermittedAttributeChanges,
} from "../services/userPoolService.interface";
import {Target} from "./Target";
import {ContextInterface} from "../services/context.interface";

const sendAttributeVerificationCode = async (
    ctx: ContextInterface,
    userPool: UserPoolServiceInterface,
    user: UserInterface,
    messages: MessagesInterface,
    req: AdminUpdateUserAttributesRequest,
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
};

export type AdminUpdateUserAttributesTarget = Target<
  AdminUpdateUserAttributesRequest,
  AdminUpdateUserAttributesResponse
>;

type AdminUpdateUserAttributesServices = Pick<
  ServicesInterface,
  "clock" | "cognito" | "otp" | "messages"
>;

export const AdminUpdateUserAttributes =
  ({
    clock,
    cognito,
    otp,
    messages,
  }: AdminUpdateUserAttributesServices): AdminUpdateUserAttributesTarget =>
  async (ctx, req) => {
    const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
    const user = await userPool.getUserByUsername(ctx, req.Username);
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

      await sendAttributeVerificationCode(
        ctx,
        userPool,
        user,
        messages,
        req,
        code
      );
    }

    return {};
  };
