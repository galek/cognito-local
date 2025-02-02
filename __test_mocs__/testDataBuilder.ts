import { v4 } from "uuid";
import { USER_POOL_AWS_DEFAULTS } from "../src/services/cognitoService";
import { AppClientInterface } from "../src/interfaces/services/appClient.interface";
import { UserInterface, UserPool } from "../dist/interfaces/services/userPoolService.interface";
import { GroupInterface } from "../dist/interfaces/services/group.interface";

export const id = (prefix: string, number?: number) =>
  `${prefix}${number ?? Math.floor(Math.random() * 100000)}`;

export const appClient = (partial?: Partial<AppClientInterface>): AppClientInterface => ({
  AccessTokenValidity: partial?.AccessTokenValidity,
  AllowedOAuthFlows: partial?.AllowedOAuthFlows,
  AllowedOAuthFlowsUserPoolClient: partial?.AllowedOAuthFlowsUserPoolClient,
  AllowedOAuthScopes: partial?.AllowedOAuthScopes,
  AnalyticsConfiguration: partial?.AnalyticsConfiguration,
  CallbackURLs: partial?.CallbackURLs,
  ClientId: partial?.ClientId ?? id("AppClient"),
  ClientName: partial?.ClientName ?? id("ClientName"),
  ClientSecret: partial?.ClientSecret ?? undefined,
  CreationDate: partial?.CreationDate ?? new Date(),
  DefaultRedirectURI: partial?.DefaultRedirectURI,
  EnableTokenRevocation: partial?.EnableTokenRevocation,
  ExplicitAuthFlows: partial?.ExplicitAuthFlows,
  IdTokenValidity: partial?.IdTokenValidity,
  LastModifiedDate: partial?.LastModifiedDate ?? new Date(),
  LogoutURLs: partial?.LogoutURLs,
  PreventUserExistenceErrors: partial?.PreventUserExistenceErrors,
  ReadAttributes: partial?.ReadAttributes,
  RefreshTokenValidity: partial?.RefreshTokenValidity,
  SupportedIdentityProviders: partial?.SupportedIdentityProviders,
  TokenValidityUnits: partial?.TokenValidityUnits,
  UserPoolId: partial?.UserPoolId ?? id("UserPool"),
  WriteAttributes: partial?.WriteAttributes,
});

export const group = (partial?: Partial<GroupInterface>): GroupInterface => ({
  CreationDate: partial?.CreationDate ?? new Date(),
  Description: partial?.Description ?? undefined,
  GroupName: partial?.GroupName ?? id("Group"),
  LastModifiedDate: partial?.LastModifiedDate ?? new Date(),
  Precedence: partial?.Precedence ?? undefined,
  RoleArn: partial?.RoleArn ?? undefined,
  members: partial?.members ?? undefined,
});

export const user = (partial?: Partial<UserInterface>): UserInterface => ({
  Attributes: partial?.Attributes ?? [
    { Name: "sub", Value: v4() },
    { Name: "email", Value: `${id("example")}@example.com` },
  ],
  AttributeVerificationCode: partial?.AttributeVerificationCode ?? undefined,
  ConfirmationCode: partial?.ConfirmationCode ?? undefined,
  Enabled: partial?.Enabled ?? true,
  MFACode: partial?.MFACode ?? undefined,
  MFAOptions: partial?.MFAOptions ?? undefined,
  Password: partial?.Password ?? "Password123!",
  UserCreateDate: partial?.UserCreateDate ?? new Date(),
  UserLastModifiedDate: partial?.UserLastModifiedDate ?? new Date(),
  Username: partial?.Username ?? id("User"),
  UserStatus: partial?.UserStatus ?? "CONFIRMED",
  RefreshTokens: [],
});

export const userPool = (partial?: Partial<UserPool>): UserPool => {
  const userPoolId = partial?.Id ?? id("local_UserPool");

  return {
    AccountRecoverySetting: partial?.AccountRecoverySetting ?? undefined,
    AdminCreateUserConfig: partial?.AdminCreateUserConfig ?? undefined,
    AliasAttributes: partial?.AliasAttributes ?? undefined,
    Arn:
      partial?.Arn ?? `arn:aws:cognito-idp:local:local:userpool/${userPoolId}`,
    AutoVerifiedAttributes: partial?.AutoVerifiedAttributes ?? undefined,
    CreationDate: partial?.CreationDate ?? new Date(),
    CustomDomain: partial?.CustomDomain ?? undefined,
    DeviceConfiguration: partial?.DeviceConfiguration ?? undefined,
    Domain: partial?.Domain ?? undefined,
    EmailConfiguration: partial?.EmailConfiguration ?? undefined,
    EmailConfigurationFailure: partial?.EmailConfigurationFailure ?? undefined,
    EmailVerificationMessage: partial?.EmailVerificationMessage ?? undefined,
    EmailVerificationSubject: partial?.EmailVerificationSubject ?? undefined,
    EstimatedNumberOfUsers: partial?.EstimatedNumberOfUsers ?? undefined,
    Id: userPoolId,
    LambdaConfig: partial?.LambdaConfig ?? undefined,
    LastModifiedDate: partial?.LastModifiedDate ?? new Date(),
    MfaConfiguration: partial?.MfaConfiguration ?? undefined,
    Name: partial?.Name ?? undefined,
    Policies: partial?.Policies ?? undefined,
    SchemaAttributes:
      partial?.SchemaAttributes ?? USER_POOL_AWS_DEFAULTS.SchemaAttributes,
    SmsAuthenticationMessage: partial?.SmsAuthenticationMessage ?? undefined,
    SmsConfiguration: partial?.SmsConfiguration ?? undefined,
    SmsConfigurationFailure: partial?.SmsConfigurationFailure ?? undefined,
    SmsVerificationMessage: partial?.SmsVerificationMessage ?? undefined,
    Status: partial?.Status ?? undefined,
    UsernameAttributes: partial?.UsernameAttributes ?? undefined,
    UsernameConfiguration: partial?.UsernameConfiguration ?? undefined,
    UserPoolAddOns: partial?.UserPoolAddOns ?? undefined,
    UserPoolTags: partial?.UserPoolTags ?? undefined,
    VerificationMessageTemplate:
      partial?.VerificationMessageTemplate ?? undefined,
  };
};
