import {ListUserPoolsRequest, ListUserPoolsResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ServicesInterface} from "../services";
import {userPoolToResponseObject} from "./responses";
import {Target} from "./Target";

export type ListUserPoolsTarget = Target<ListUserPoolsRequest,
    ListUserPoolsResponse>;

type ListGroupServices = Pick<ServicesInterface, "cognito">;

export const ListUserPools =
    ({cognito}: ListGroupServices): ListUserPoolsTarget =>
  async (ctx) => {
    // TODO: NextToken support
    // TODO: MaxResults support

    const userPools = await cognito.listUserPools(ctx);

    return {
      UserPools: userPools.map(userPoolToResponseObject),
    };
  };
