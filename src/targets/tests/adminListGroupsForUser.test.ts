import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { UserNotFoundError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import {
  AdminListGroupsForUser,
  AdminListGroupsForUserTarget,
} from "../adminListGroupsForUser";

describe("AdminListGroupsForUser target", () => {
  let adminListGroupsForUser: AdminListGroupsForUserTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();

    adminListGroupsForUser = AdminListGroupsForUser({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("returns no groups when the user isn't in the group", async () => {
    const existingUser = TDB.user();
    const existingGroup1 = TDB.group();
    const existingGroup2 = TDB.group();

    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);
    mockUserPoolService.listGroups.mockResolvedValue([
      existingGroup1,
      existingGroup2,
    ]);

    const result = await adminListGroupsForUser(TestContext, {
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.listGroups).toHaveBeenCalledWith(TestContext);

    expect(result.Groups).toEqual([]);
  });

  it("returns the groups that the user is assigned to", async () => {
    const existingUser = TDB.user();
    const existingGroup1 = TDB.group();
    const existingGroup2 = TDB.group({
      members: [existingUser.Username],
    });

    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);
    mockUserPoolService.listGroups.mockResolvedValue([
      existingGroup1,
      existingGroup2,
    ]);

    const result = await adminListGroupsForUser(TestContext, {
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.listGroups).toHaveBeenCalledWith(TestContext);

    expect(result.Groups).toEqual([
      {
        CreationDate: existingGroup2.CreationDate,
        Description: existingGroup2.Description,
        GroupName: existingGroup2.GroupName,
        LastModifiedDate: existingGroup2.LastModifiedDate,
        Precedence: existingGroup2.Precedence,
        RoleArn: existingGroup2.RoleArn,
        UserPoolId: "test",
      },
    ]);
  });

  it("throws if the user doesn't exist", async () => {
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      adminListGroupsForUser(TestContext, {
        Username: "user",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError());
  });
});
