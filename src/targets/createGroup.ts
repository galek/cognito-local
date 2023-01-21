import {CreateGroupRequest, CreateGroupResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ServicesInterface} from "../services";
import {groupToResponseObject} from "./responses";
import {Target} from "./Target";
import {GroupInterface} from "../interfaces/services/group.interface";

export type CreateGroupTarget = Target<CreateGroupRequest, CreateGroupResponse>;

type CreateGroupServices = Pick<ServicesInterface, "clock" | "cognito">;

export const CreateGroup =
    ({cognito, clock}: CreateGroupServices): CreateGroupTarget =>
        async (ctx, req) => {
            const userPool = await cognito.getUserPool(ctx, req.UserPoolId);

    const now = clock.get();
    const group: GroupInterface = {
      CreationDate: now,
      Description: req.Description,
      GroupName: req.GroupName,
      LastModifiedDate: now,
      Precedence: req.Precedence,
      RoleArn: req.RoleArn,
    };

    await userPool.saveGroup(ctx, group);

    return {
      Group: groupToResponseObject(req.UserPoolId)(group),
    };
  };
