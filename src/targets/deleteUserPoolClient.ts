import {DeleteUserPoolClientRequest} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {ResourceNotFoundError} from "../errors";
import {ServicesInterface} from "../services";
import {Target} from "./Target";

export type DeleteUserPoolClientTarget = Target<DeleteUserPoolClientRequest,
    {}>;

type DeleteUserPoolClientServices = Pick<ServicesInterface, "cognito">;

export const DeleteUserPoolClient =
    ({cognito}: DeleteUserPoolClientServices): DeleteUserPoolClientTarget =>
  async (ctx, req) => {
    // TODO: from the docs "Calling this action requires developer credentials.", can we enforce this?

    const userPool = await cognito.getUserPool(ctx, req.UserPoolId);
    const appClient = await cognito.getAppClient(ctx, req.ClientId);
    if (!appClient || appClient.UserPoolId !== req.UserPoolId) {
      throw new ResourceNotFoundError();
    }

    await userPool.deleteAppClient(ctx, appClient);

    return {};
  };
