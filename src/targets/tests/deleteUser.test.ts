import jwt from "jsonwebtoken";
import * as uuid from "uuid";
import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { InvalidParameterError, NotAuthorizedError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import { DeleteUser, DeleteUserTarget } from "../deleteUser";
import { PrivateKey } from "../../keys/cognitoLocal.private.json";

describe("DeleteUser target", () => {
  let deleteUser: DeleteUserTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    deleteUser = DeleteUser({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("parses token get user by sub", async () => {
    const user = TDB.user();

    mockUserPoolService.getUserByUsername.mockResolvedValue(user);

    await deleteUser(TestContext, {
      AccessToken: jwt.sign(
        {
          sub: "0000-0000",
          event_id: "0",
          token_use: "access",
          scope: "aws.cognito.signin.user.admin",
          auth_time: new Date(),
          jti: uuid.v4(),
          client_id: "test",
          username: "0000-0000",
        },
        PrivateKey.pem,
        {
          algorithm: "RS256",
          issuer: `http://localhost:9229/test`,
          expiresIn: "24h",
          keyid: "CognitoLocal",
        }
      ),
    });

    expect(mockUserPoolService.deleteUser).toHaveBeenCalledWith(
      TestContext,
      user
    );
  });

  it("throws if token isn't valid", async () => {
    await expect(
      deleteUser(TestContext, {
        AccessToken: "blah",
      })
    ).rejects.toBeInstanceOf(InvalidParameterError);
  });

  it("throws if user doesn't exist", async () => {
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      deleteUser(TestContext, {
        AccessToken: jwt.sign(
          {
            sub: "0000-0000",
            event_id: "0",
            token_use: "access",
            scope: "aws.cognito.signin.user.admin",
            auth_time: new Date(),
            jti: uuid.v4(),
            client_id: "test",
            username: "0000-0000",
          },
          PrivateKey.pem,
          {
            algorithm: "RS256",
            issuer: `http://localhost:9229/test`,
            expiresIn: "24h",
            keyid: "CognitoLocal",
          }
        ),
      })
    ).rejects.toEqual(new NotAuthorizedError());
  });
});
