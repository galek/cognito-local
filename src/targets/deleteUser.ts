import {DeleteUserRequest} from "aws-sdk/clients/cognitoidentityserviceprovider";
import jwt from "jsonwebtoken";
import {InvalidParameterError, NotAuthorizedError} from "../errors";
import {ServicesInterface} from "../services";
import {TokenInterface} from "../interfaces/services/tokenGenerator.interface";
import {Target} from "./Target";

export type DeleteUserTarget = Target<DeleteUserRequest, {}>;

type DeleteUserServices = Pick<ServicesInterface, "cognito">;

export const DeleteUser =
    ({cognito}: DeleteUserServices): DeleteUserTarget =>
        async (ctx, req) => {
            const decodedToken = jwt.decode(req.AccessToken) as TokenInterface | null;
            if (!decodedToken) {
      ctx.logger.info("Unable to decode token");
      throw new InvalidParameterError();
    }

    const userPool = await cognito.getUserPoolForClientId(
      ctx,
      decodedToken.client_id
    );
    const user = await userPool.getUserByUsername(ctx, decodedToken.sub);
    if (!user) {
      throw new NotAuthorizedError();
    }

    await userPool.deleteUser(ctx, user);

    return {};
  };
