import {ListUsersRequest, ListUsersResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ServicesInterface} from "../services";
import {userToResponseObject} from "./responses";
import {Target} from "./Target";

export type ListUsersTarget = Target<ListUsersRequest, ListUsersResponse>;

export const ListUsers =
    ({cognito}: Pick<ServicesInterface, "cognito">): ListUsersTarget =>
        async (ctx, req) => {
            const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
            const users = await userPool.listUsers(ctx);

            // TODO: support AttributesToGet
    // TODO: support Filter
    // TODO: support Limit
    // TODO: support PaginationToken

    return {
      Users: users.map(userToResponseObject),
    };
  };
