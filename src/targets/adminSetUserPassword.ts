import {
    AdminSetUserPasswordRequest,
    AdminSetUserPasswordResponse,
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {UserNotFoundError} from "../errors";
import {ServicesInterface} from "../services";
import {Target} from "./Target";

export type AdminSetUserPasswordTarget = Target<AdminSetUserPasswordRequest,
    AdminSetUserPasswordResponse>;

type AdminSetUserPasswordServices = Pick<ServicesInterface, "clock" | "cognito">;

export const AdminSetUserPassword =
    ({
    cognito,
    clock,
  }: AdminSetUserPasswordServices): AdminSetUserPasswordTarget =>
  async (ctx, req) => {
    const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
    const user = await userPool.getUserByUsername(ctx, req.Username);
    if (!user) {
      throw new UserNotFoundError("User does not exist");
    }

    await userPool.saveUser(ctx, {
      ...user,
      Password: req.Password,
      UserLastModifiedDate: clock.get(),
      UserStatus: req.Permanent ? "CONFIRMED" : "FORCE_CHANGE_PASSWORD",
    });

    return {};
  };
