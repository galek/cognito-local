import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { CognitoService } from "../../services";
import { DeleteUserPool, DeleteUserPoolTarget } from "../deleteUserPool";

describe("DeleteUserPool target", () => {
  let deleteUserPool: DeleteUserPoolTarget;
  let mockCognitoService: jest.Mocked<CognitoService>;

  beforeEach(() => {
    mockCognitoService = newMockCognitoService(newMockUserPoolService());

    deleteUserPool = DeleteUserPool({
      cognito: mockCognitoService,
    });
  });

  it("deletes a user pool client", async () => {
    const userPool = TDB.userPool();

    mockCognitoService.getUserPool.mockResolvedValue(
      newMockUserPoolService(userPool)
    );

    await deleteUserPool(TestContext, {
      UserPoolId: "test",
    });

    expect(mockCognitoService.deleteUserPool).toHaveBeenCalledWith(
      TestContext,
      userPool
    );
  });

  it.todo("throws if the user pool doesn't exist");
});
