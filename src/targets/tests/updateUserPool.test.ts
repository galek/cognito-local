import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { CognitoService, UserPoolServiceInterface } from "../../services";
import { UpdateUserPool, UpdateUserPoolTarget } from "../updateUserPool";

describe("UpdateUserPool target", () => {
  let updateUserPool: UpdateUserPoolTarget;
  let mockCognitoService: jest.Mocked<CognitoService>;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();
    mockCognitoService = newMockCognitoService(mockUserPoolService);

    updateUserPool = UpdateUserPool({
      cognito: mockCognitoService,
    });
  });

  it("updates a user pool", async () => {
    const existingUserPool = TDB.userPool({
      Name: "name",
    });

    const userPoolService = newMockUserPoolService(existingUserPool);

    mockCognitoService.getUserPool.mockResolvedValue(userPoolService);

    await updateUserPool(TestContext, {
      UserPoolId: existingUserPool.Id,
      MfaConfiguration: "OPTIONAL",
    });

    expect(userPoolService.updateOptions).toHaveBeenCalledWith(TestContext, {
      ...existingUserPool,
      MfaConfiguration: "OPTIONAL",
    });
  });

  it.todo("throws if the user pool client doesn't exist");
});
