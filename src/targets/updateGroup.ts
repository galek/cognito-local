import {UpdateGroupRequest, UpdateGroupResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ServicesInterface} from "../services";
import {GroupNotFoundError} from "../errors";
import {groupToResponseObject} from "./responses";
import {Target} from "./Target";

export type UpdateGroupTarget = Target<UpdateGroupRequest, UpdateGroupResponse>;

type UpdateGroupServices = Pick<ServicesInterface, "clock" | "cognito">;

export const UpdateGroup =
    ({clock, cognito}: UpdateGroupServices): UpdateGroupTarget =>
        async (ctx, req) => {
            const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
            const group = await userPool.getGroupByGroupName(ctx, req.GroupName);
    if (!group) {
      throw new GroupNotFoundError();
    }

    const updatedGroup = {
      ...group,
      Description: req.Description ?? group.Description,
      Precedence: req.Precedence ?? group.Precedence,
      RoleArn: req.RoleArn ?? group.RoleArn,
      LastModifiedDate: clock.get(),
    };

    await userPool.saveGroup(ctx, updatedGroup);

    return {
      Group: groupToResponseObject(req.UserPoolId)(updatedGroup),
    };
  };
