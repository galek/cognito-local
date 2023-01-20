import { CognitoService, UserPoolServiceInterface } from "../src/services";
import { CognitoServiceFactoryInterface } from "../src/services/cognitoService";
import { newMockUserPoolService } from "./mockUserPoolService";

export const newMockCognitoService = (
  userPoolClient: UserPoolServiceInterface = newMockUserPoolService()
): jest.Mocked<CognitoService> => ({
  createUserPool: jest.fn(),
  deleteUserPool: jest.fn(),
  getAppClient: jest.fn(),
  getUserPool: jest.fn().mockResolvedValue(userPoolClient),
  getUserPoolForClientId: jest.fn().mockResolvedValue(userPoolClient),
  listAppClients: jest.fn(),
  listUserPools: jest.fn(),
});

export const newMockCognitoServiceFactory = (
  cognitoService: jest.Mocked<CognitoService> = newMockCognitoService()
): jest.Mocked<CognitoServiceFactoryInterface> => ({
  create: jest.fn().mockResolvedValue(cognitoService),
});
