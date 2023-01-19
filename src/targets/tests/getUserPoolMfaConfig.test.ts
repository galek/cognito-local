import { newMockCognitoService } from "../../../__test_mocs__/mockCognitoService";
import { newMockUserPoolService } from "../../../__test_mocs__/mockUserPoolService";
import { TestContext } from "../../../__test_mocs__/testContext";
import { UserPoolService } from "../../services";
import * as TDB from "../../../__test_mocs__/testDataBuilder";
import {
  GetUserPoolMfaConfig,
  GetUserPoolMfaConfigTarget,
} from "../getUserPoolMfaConfig";

describe("GetUserPoolMfaConfig target", () => {
  let getUserPoolMfaConfig: GetUserPoolMfaConfigTarget;
  let mockUserPoolService: jest.Mocked<UserPoolService>;

  const userPool = TDB.userPool({
    MfaConfiguration: "ON",
    SmsAuthenticationMessage: "hello, world!",
    SmsConfiguration: {
      ExternalId: "abc",
      SnsCallerArn: "arn",
      SnsRegion: "region",
    },
  });

  beforeEach(() => {
    mockUserPoolService = newMockUserPoolService(userPool);
    getUserPoolMfaConfig = GetUserPoolMfaConfig({
      cognito: newMockCognitoService(mockUserPoolService),
    });
  });

  it("returns the user pool's MFA config", async () => {
    const output = await getUserPoolMfaConfig(TestContext, {
      UserPoolId: "test",
    });

    expect(output).toEqual({
      MfaConfiguration: "ON",
      SmsMfaConfiguration: {
        SmsAuthenticationMessage: "hello, world!",
        SmsConfiguration: {
          ExternalId: "abc",
          SnsCallerArn: "arn",
          SnsRegion: "region",
        },
      },
      SoftwareTokenMfaConfiguration: {
        Enabled: false,
      },
    });
  });
});
