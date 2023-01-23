import { UserPoolServiceInterface } from "../src/services";
import { UserPool, UserPoolServiceFactoryInterface } from "../dist/interfaces/services/userPoolService.interface";

export const newMockUserPoolService = (
  config: UserPool = {
    Id: "test",
  }
): jest.Mocked<UserPoolServiceInterface> => ({
  addUserToGroup: jest.fn(),
  deleteAppClient: jest.fn(),
  deleteGroup: jest.fn(),
  deleteUser: jest.fn(),
  getGroupByGroupName: jest.fn(),
  getUserByRefreshToken: jest.fn(),
  getUserByUsername: jest.fn(),
  listGroups: jest.fn(),
  listUserGroupMembership: jest.fn(),
  listUsers: jest.fn(),
  options: config,
  removeUserFromGroup: jest.fn(),
  saveAppClient: jest.fn(),
  saveGroup: jest.fn(),
  saveUser: jest.fn(),
  storeRefreshToken: jest.fn(),
  updateOptions: jest.fn(),
});

export const newMockUserPoolServiceFactory = (
  cognitoService: jest.Mocked<UserPoolServiceInterface> = newMockUserPoolService()
): jest.Mocked<UserPoolServiceFactoryInterface> => ({
  create: jest.fn().mockResolvedValue(cognitoService),
});
