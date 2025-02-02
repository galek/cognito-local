import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import { GroupNotFoundError, UserNotFoundError } from "../../errors";
import { UserPoolServiceInterface } from "../../services";
import {
  AdminRemoveUserFromGroup,
  AdminRemoveUserFromGroupTarget,
} from "../adminRemoveUserFromGroup";

describe("AdminRemoveUserFromGroup target", () => {
  let adminRemoveUserFromGroup: AdminRemoveUserFromGroupTarget;
  let mockUserPoolService: jest.Mocked<UserPoolServiceInterface>;

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService();

    adminRemoveUserFromGroup = AdminRemoveUserFromGroup({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("removes the user from a group", async () => {
    const existingUser = TDB.user();
    const existingGroup = TDB.group({
      members: ["other-user", existingUser.Username],
    });

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(existingGroup);
    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    await adminRemoveUserFromGroup(TestContext, {
      GroupName: existingGroup.GroupName,
      Username: existingUser.Username,
      UserPoolId: "test",
    });

    expect(mockUserPoolService.removeUserFromGroup).toHaveBeenCalledWith(
      TestContext,
      existingGroup,
      existingUser
    );
  });

  it("throws if the group doesn't exist", async () => {
    const existingUser = TDB.user();

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(null);
    mockUserPoolService.getUserByUsername.mockResolvedValue(existingUser);

    await expect(
      adminRemoveUserFromGroup(TestContext, {
        GroupName: "group",
        Username: existingUser.Username,
        UserPoolId: "test",
      })
    ).rejects.toEqual(new GroupNotFoundError());
  });

  it("throws if the user doesn't exist", async () => {
    const existingGroup = TDB.group();

    mockUserPoolService.getGroupByGroupName.mockResolvedValue(existingGroup);
    mockUserPoolService.getUserByUsername.mockResolvedValue(null);

    await expect(
      adminRemoveUserFromGroup(TestContext, {
        GroupName: existingGroup.GroupName,
        Username: "user",
        UserPoolId: "test",
      })
    ).rejects.toEqual(new UserNotFoundError());
  });
});
