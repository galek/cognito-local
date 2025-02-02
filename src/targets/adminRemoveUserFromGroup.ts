import {AdminRemoveUserFromGroupRequest} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {GroupNotFoundError, UserNotFoundError} from "../errors";
import {ServicesInterface} from "../services";
import {Target} from "./Target";

export type AdminRemoveUserFromGroupTarget = Target<AdminRemoveUserFromGroupRequest,
    {}>;

type AdminRemoveUserFromGroupServices = Pick<ServicesInterface, "cognito">;

export const AdminRemoveUserFromGroup =
    ({
    cognito,
  }: AdminRemoveUserFromGroupServices): AdminRemoveUserFromGroupTarget =>
  async (ctx, req) => {
    const userPool = await cognito.getUserPool(ctx, req.UserPoolId);

    const group = await userPool.getGroupByGroupName(ctx, req.GroupName);
    if (!group) {
      throw new GroupNotFoundError();
    }

    const user = await userPool.getUserByUsername(ctx, req.Username);
    if (!user) {
      throw new UserNotFoundError();
    }

    await userPool.removeUserFromGroup(ctx, group, user);

    return {};
  };
