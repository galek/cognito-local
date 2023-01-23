import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { CognitoService } from "../../services";
import { ListUserPools, ListUserPoolsTarget } from "./../listUserPools";

describe("ListUserPools target", () => {
  let listUserPools: ListUserPoolsTarget;
  let mockCognitoService: jest.Mocked<CognitoService>;

  beforeEach(() => {
    mockCognitoService = newMockCognitoService(newMockUserPoolService());
    listUserPools = ListUserPools({
      cognito: mockCognitoService,
    });
  });

  it("lists user pools", async () => {
    const userPool1 = TDB.userPool();
    const userPool2 = TDB.userPool();

    mockCognitoService.listUserPools.mockResolvedValue([userPool1, userPool2]);

    const output = await listUserPools(TestContext, {
      MaxResults: 10,
    });

    expect(output).toBeDefined();
    expect(output.UserPools).toEqual([userPool1, userPool2]);
  });
});
