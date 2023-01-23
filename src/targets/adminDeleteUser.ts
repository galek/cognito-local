import {AdminDeleteUserRequest} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ServicesInterface} from "../services";
import {UserNotFoundError} from "../errors";
import {Target} from "./Target";

export type AdminDeleteUserTarget = Target<AdminDeleteUserRequest, {}>;

type AdminDeleteUserServices = Pick<ServicesInterface, "cognito">;

export const AdminDeleteUser =
    ({cognito}: AdminDeleteUserServices): AdminDeleteUserTarget =>
        async (ctx, req) => {
            const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
            const user = await userPool.getUserByUsername(ctx, req.Username);
    if (!user) {
      throw new UserNotFoundError("User does not exist");
    }

    await userPool.deleteUser(ctx, user);

    return {};
  };
