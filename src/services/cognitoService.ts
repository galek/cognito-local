import mergeWith from "lodash.mergewith";
import * as path from "path";
import {ResourceNotFoundError} from "../errors";
import {AppClientInterface} from "../interfaces/services/appClient.interface";
import {ClockInterface} from "../interfaces/services/clock.interface";
import {ContextInterface} from "../interfaces/services/context.interface";
import {DataStoreInterface} from "../interfaces/services/dataStore.interface";
import {DataStoreFactoryInterface} from "./dataStore/factory";
import {
    UserPool,
    UserPoolServiceInterface,
    UserPoolServiceFactoryInterface,
    UserPoolDefaults,
} from "../interfaces/services/userPoolService.interface";
import fs from "fs/promises";

const CLIENTS_DATABASE_NAME = "clients";

// These defaults were pulled from Cognito on 2021-11-26 by creating a new User Pool with only a Name and
// capturing what defaults Cognito set on the pool.
//
// To recreate run: aws cognito-idp create-user-pool --pool-name testing
// and remove the Id, Arn, and Name from the response.
export const USER_POOL_AWS_DEFAULTS: UserPoolDefaults = {
    Policies: {
        PasswordPolicy: {
            MinimumLength: 8,
            RequireUppercase: true,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            TemporaryPasswordValidityDays: 7,
        },
    },
    LambdaConfig: {},
    SchemaAttributes: [
        {
            Name: "sub",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: false,
            Required: true,
            StringAttributeConstraints: {
                MinLength: "1",
                MaxLength: "2048",
            },
        },
        {
            Name: "name",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "given_name",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "family_name",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "middle_name",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "nickname",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "preferred_username",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "profile",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "picture",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "website",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "email",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "email_verified",
            AttributeDataType: "Boolean",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
        },
        {
            Name: "gender",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "birthdate",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "10",
                MaxLength: "10",
            },
        },
        {
            Name: "zoneinfo",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "locale",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "phone_number",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "phone_number_verified",
            AttributeDataType: "Boolean",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
        },
        {
            Name: "address",
            AttributeDataType: "String",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            StringAttributeConstraints: {
                MinLength: "0",
                MaxLength: "2048",
            },
        },
        {
            Name: "updated_at",
            AttributeDataType: "Number",
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
            NumberAttributeConstraints: {
                MinValue: "0",
            },
        },
    ],
    VerificationMessageTemplate: {
        DefaultEmailOption: "CONFIRM_WITH_CODE",
    },
    MfaConfiguration: "OFF",
    EstimatedNumberOfUsers: 0,
    EmailConfiguration: {
        EmailSendingAccount: "COGNITO_DEFAULT",
    },
    AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
        UnusedAccountValidityDays: 7,
    },
};

export interface CognitoService {
    createUserPool(ctx: ContextInterface, userPool: UserPool): Promise<UserPool>;

    deleteUserPool(ctx: ContextInterface, userPool: UserPool): Promise<void>;

    getAppClient(ctx: ContextInterface, clientId: string): Promise<AppClientInterface | null>;

    getUserPool(ctx: ContextInterface, userPoolId: string): Promise<UserPoolServiceInterface>;

    getUserPoolForClientId(
        ctx: ContextInterface,
        clientId: string
    ): Promise<UserPoolServiceInterface>;

    listAppClients(
        ctx: ContextInterface,
        userPoolId: string
    ): Promise<readonly AppClientInterface[]>;

    listUserPools(ctx: ContextInterface): Promise<readonly UserPool[]>;
}

export interface CognitoServiceFactoryInterface {
    create(
        ctx: ContextInterface,
        userPoolDefaultConfig: UserPoolDefaults
    ): Promise<CognitoService>;
}

export class CognitoServiceImpl implements CognitoService {
    private readonly clients: DataStoreInterface;
    private readonly clock: ClockInterface;
    private readonly userPoolServiceFactory: UserPoolServiceFactoryInterface;
    private readonly dataDirectory: string;
    private readonly userPoolDefaultConfig: UserPoolDefaults;

    public constructor(
        dataDirectory: string,
        clients: DataStoreInterface,
        clock: ClockInterface,
        userPoolDefaultConfig: UserPoolDefaults,
        userPoolServiceFactory: UserPoolServiceFactoryInterface
    ) {
        this.clients = clients;
        this.clock = clock;
        this.dataDirectory = dataDirectory;
        this.userPoolDefaultConfig = userPoolDefaultConfig;
        this.userPoolServiceFactory = userPoolServiceFactory;
    }

    public async createUserPool(
        ctx: ContextInterface,
        userPool: UserPool
    ): Promise<UserPool> {
        ctx.logger.debug("CognitoServiceImpl.createUserPool");
        const service = await this.userPoolServiceFactory.create(
            ctx,
            this.clients,
            mergeWith(
                {},
                USER_POOL_AWS_DEFAULTS,
                this.userPoolDefaultConfig,
                userPool
            )
        );

        return service.options;
    }

    public async deleteUserPool(ctx: ContextInterface, userPool: UserPool): Promise<void> {
        ctx.logger.debug(
            {userPoolId: userPool.Id},
            "CognitoServiceImpl.deleteUserPool"
        );
        await fs.rm(path.join(this.dataDirectory, `${userPool.Id}.json`));
    }

    public async getUserPool(
        ctx: ContextInterface,
        userPoolId: string
    ): Promise<UserPoolServiceInterface> {
        ctx.logger.debug({userPoolId}, "CognitoServiceImpl.getUserPool");
        return this.userPoolServiceFactory.create(ctx, this.clients, {
            ...USER_POOL_AWS_DEFAULTS,
            ...this.userPoolDefaultConfig,
            Id: userPoolId,
        });
    }

    public async getUserPoolForClientId(
        ctx: ContextInterface,
        clientId: string
    ): Promise<UserPoolServiceInterface> {
        ctx.logger.debug({clientId}, "CognitoServiceImpl.getUserPoolForClientId");
        const appClient = await this.getAppClient(ctx, clientId);
        if (!appClient) {
            throw new ResourceNotFoundError();
        }

        return this.userPoolServiceFactory.create(ctx, this.clients, {
            ...USER_POOL_AWS_DEFAULTS,
            ...this.userPoolDefaultConfig,
            Id: appClient.UserPoolId,
        });
    }

    public async getAppClient(
        ctx: ContextInterface,
        clientId: string
    ): Promise<AppClientInterface | null> {
        ctx.logger.debug({clientId}, "CognitoServiceImpl.getAppClient");
        return this.clients.get(ctx, ["Clients", clientId]);
    }

    public async listAppClients(
        ctx: ContextInterface,
        userPoolId: string
    ): Promise<readonly AppClientInterface[]> {
        ctx.logger.debug({userPoolId}, "CognitoServiceImpl.listAppClients");
        const clients = await this.clients.get<Record<string, AppClientInterface>>(
            ctx,
            "Clients",
            {}
        );

        return Object.values(clients).filter((x) => x.UserPoolId === userPoolId);
    }

    public async listUserPools(ctx: ContextInterface): Promise<readonly UserPool[]> {
        ctx.logger.debug("CognitoServiceImpl.listUserPools");
        const entries = await fs.readdir(this.dataDirectory, {
            withFileTypes: true,
        });

        return Promise.all(
            entries
                .filter(
                    (x) =>
                        x.isFile() &&
                        path.extname(x.name) === ".json" &&
                        path.basename(x.name, path.extname(x.name)) !==
                        CLIENTS_DATABASE_NAME
                )
                .map(async (x) => {
                    const userPool = await this.getUserPool(
                        ctx,
                        path.basename(x.name, path.extname(x.name))
                    );

                    return userPool.options;
                })
        );
    }
}

export class CognitoServiceFactoryImpl implements CognitoServiceFactoryInterface {
    private readonly dataDirectory: string;
    private readonly clock: ClockInterface;
    private readonly dataStoreFactory: DataStoreFactoryInterface;
    private readonly userPoolServiceFactory: UserPoolServiceFactoryInterface;

    public constructor(
        dataDirectory: string,
        clock: ClockInterface,
        dataStoreFactory: DataStoreFactoryInterface,
        userPoolServiceFactory: UserPoolServiceFactoryInterface
    ) {
        this.dataDirectory = dataDirectory;
        this.clock = clock;
        this.dataStoreFactory = dataStoreFactory;
        this.userPoolServiceFactory = userPoolServiceFactory;
    }

    public async create(
        ctx: ContextInterface,
        userPoolDefaultConfig: UserPoolDefaults
    ): Promise<CognitoService> {
        const clients = await this.dataStoreFactory.create(
            ctx,
            CLIENTS_DATABASE_NAME,
            {Clients: {}}
        );

        return new CognitoServiceImpl(
            this.dataDirectory,
            clients,
            this.clock,
            userPoolDefaultConfig,
            this.userPoolServiceFactory
        );
    }
}
