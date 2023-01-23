import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { CognitoService, UserPoolServiceInterface } from "../../services";
import { RevokeToken, RevokeTokenTarget } from "../revokeToken";

describe("AdminInitiateAuth target", () => {
  let revokeToken: RevokeTokenTarget;

  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;
  let mockCognitoService: jest.Mocked<CognitoService>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    mockCognitoService = newMockCognitoService(mockUserPoolService);

    revokeToken = RevokeToken({
      cognito: mockCognitoService,
    });
  });

  it("remove refresh tokens from user refresh tokens", async () => {
    const existingUser = TDB.user();
    existingUser.RefreshTokens.push("token");

    mockUserPoolService.listUsers.mockResolvedValue([existingUser]);

    await revokeToken(TestContext, {
      ClientId: "clientId",
      Token: "token",
    });

    expect(mockUserPoolService.saveUser).toBeCalledWith(
      TestContext,
      expect.objectContaining({
        RefreshTokens: [],
      })
    );
  });
});
