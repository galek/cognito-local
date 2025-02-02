import {AdminGetUserRequest, AdminGetUserResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {UserNotFoundError} from "../errors";
import {ServicesInterface} from "../services";
import {Target} from "./Target";

export type AdminGetUserTarget = Target<AdminGetUserRequest,
    AdminGetUserResponse>;

type AdminGetUserServices = Pick<ServicesInterface, "cognito">;

export const AdminGetUser =
    ({cognito}: AdminGetUserServices): AdminGetUserTarget =>
  async (ctx, req) => {
    const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
    const user = await userPool.getUserByUsername(ctx, req.Username);
    if (!user) {
      throw new UserNotFoundError("User does not exist");
    }

    return {
      Enabled: user.Enabled,
      MFAOptions: user.MFAOptions,
      PreferredMfaSetting: undefined,
      UserAttributes: user.Attributes,
      UserCreateDate: user.UserCreateDate,
      UserLastModifiedDate: user.UserLastModifiedDate,
      UserMFASettingList: undefined,
      Username: user.Username,
      UserStatus: user.UserStatus,
    };
  };
