import { UUID } from "../../__test_mocs__/patterns";
import { TestContext } from "../../__test_mocs__/testContext";
import { withCognitoSdk } from "./setup";
import { UserInterface } from "../../src/services/userPoolServiceInterface";

describe(
  "CognitoIdentityServiceProvider.getUserAttributeVerificationCode",
  withCognitoSdk((Cognito, { dataStoreFactory }) => {
    it("sends a verification code for a user's attribute", async () => {
      const client = Cognito();

      const pool = await client
        .createUserPool({
          PoolName: "test",
          AutoVerifiedAttributes: ["email"],
        })
        .promise();
      const userPoolId = pool.UserPool?.Id as string;

      const upc = await client
        .createUserPoolClient({
          UserPoolId: userPoolId,
          ClientName: "test",
        })
        .promise();

      await client
        .adminCreateUser({
          UserAttributes: [{ Name: "email", Value: "example@example.com" }],
          Username: "abc",
          UserPoolId: userPoolId,
          TemporaryPassword: "def",
          DesiredDeliveryMediums: ["EMAIL"],
        })
        .promise();

      await client
        .adminConfirmSignUp({
          UserPoolId: userPoolId,
          Username: "abc",
        })
        .promise();

      // login as the user
      const initiateAuthResponse = await client
        .initiateAuth({
          AuthFlow: "USER_PASSWORD_AUTH",
          AuthParameters: {
            USERNAME: "abc",
            PASSWORD: "def",
          },
          ClientId: upc.UserPoolClient?.ClientId as string,
        })
        .promise();

      await client
        .getUserAttributeVerificationCode({
          AccessToken: initiateAuthResponse.AuthenticationResult
            ?.AccessToken as string,
          AttributeName: "email",
        })
        .promise();

      // get the user's code -- this is very nasty
      const ds = await dataStoreFactory().create(TestContext, userPoolId, {});
      const storedUser = (await ds.get(TestContext, ["Users", "abc"])) as UserInterface;

      expect(storedUser.AttributeVerificationCode).toMatch(/^\d{6}$/);
    });
  })
);
