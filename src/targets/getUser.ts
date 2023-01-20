import {GetUserRequest, GetUserResponse,} from "aws-sdk/clients/cognitoidentityserviceprovider";
import jwt from "jsonwebtoken";
import {InvalidParameterError, UserNotFoundError} from "../errors";
import {Services} from "../services";
import {TokenInterface} from "../services/tokenGeneratorInterface";
import {Target} from "./Target";

export type GetUserTarget = Target<GetUserRequest, GetUserResponse>;

export const GetUser =
    ({cognito}: Pick<Services, "cognito">): GetUserTarget =>
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
      throw new UserNotFoundError();
    }

    return {
      MFAOptions: user.MFAOptions,
      PreferredMfaSetting: user.PreferredMfaSetting,
      UserAttributes: user.Attributes,
      UserMFASettingList: user.UserMFASettingList,
      Username: user.Username,
    };
  };
