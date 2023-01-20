import {
    AttributeListType,
    AttributeType,
    MFAOptionListType,
    SchemaAttributesListType,
    StringType,
    UserMFASettingListType,
    UserPoolType,
    UserStatusType,
} from "aws-sdk/clients/cognitoidentityserviceprovider";
import {InvalidParameterError} from "../errors";
import {AppClientInterface} from "./appClient.interface";
import {ClockInterface} from "./clock.interface";
import {ContextInterface} from "./context.interface";
import {DataStoreInterface} from "./dataStore/dataStore.interface";
import {DataStoreFactoryInterface} from "./dataStore/factory";
import {GroupInterface} from "./interfaces/group.interface";

export interface MFAOptionInterface {
    DeliveryMedium: "SMS";
    AttributeName: "phone_number";
}

export const attribute = (
    name: string,
    value: string | undefined
): AttributeType => ({Name: name, Value: value});
export const attributesIncludeMatch = (
    attributeName: string,
    attributeValue: string,
    attributes: AttributeListType | undefined
) =>
    !!(attributes ?? []).find(
        (x) => x.Name === attributeName && x.Value === attributeValue
    );
export const attributesInclude = (
    attributeName: string,
    attributes: AttributeListType | undefined
) => !!(attributes ?? []).find((x) => x.Name === attributeName);
export const attributeValue = (
    attributeName: string | undefined,
    attributes: AttributeListType | undefined
) => (attributes ?? []).find((x) => x.Name === attributeName)?.Value;
export const attributesToRecord = (
    attributes: AttributeListType | undefined
): Record<string, string> =>
    (attributes ?? []).reduce(
        (acc, attr) => ({...acc, [attr.Name]: attr.Value}),
        {}
    );
export const attributesFromRecord = (
    attributes: Record<string, string>
): AttributeListType =>
    Object.entries(attributes).map(([Name, Value]) => ({Name, Value}));
export const attributesAppend = (
    attributes: AttributeListType | undefined,
    ...toAppend: AttributeListType
): AttributeListType => {
    const attributeSet = attributesToRecord(attributes);

    for (const attr of toAppend) {
        if (attr.Value) {
            attributeSet[attr.Name] = attr.Value;
        } else {
            delete attributeSet[attr.Name];
        }
    }

    return attributesFromRecord(attributeSet);
};

export const attributesRemove = (
    attributes: AttributeListType | undefined,
    ...toRemove: readonly string[]
): AttributeListType =>
    attributes?.filter((x) => !toRemove.includes(x.Name)) ?? [];

export const customAttributes = (
    attributes: AttributeListType | undefined
): AttributeListType =>
    (attributes ?? []).filter((attr) => attr.Name.startsWith("custom:"));

export interface UserInterface {
    Attributes: AttributeListType;
    Enabled: boolean;
    MFAOptions?: MFAOptionListType;
    PreferredMfaSetting?: StringType;
    UserCreateDate: Date;
    UserLastModifiedDate: Date;
    UserMFASettingList?: UserMFASettingListType;
    Username: string;
    UserStatus: UserStatusType;

    // extra attributes for Cognito Local
    Password: string;
    AttributeVerificationCode?: string;
    ConfirmationCode?: string;
    MFACode?: string;
    RefreshTokens: string[];
}

// just use the types from the sdk, but make Id required
export type UserPool = UserPoolType & {
    Id: string;
};

export type UserPoolDefaults = Omit<UserPool,
    "Id" | "CreationDate" | "LastModifiedDate">;

export interface UserPoolServiceInterface {
    readonly options: UserPool;

    addUserToGroup(ctx: ContextInterface, group: GroupInterface, user: UserInterface): Promise<void>;

    saveAppClient(ctx: ContextInterface, appClient: AppClientInterface): Promise<void>;

    deleteAppClient(ctx: ContextInterface, appClient: AppClientInterface): Promise<void>;

    deleteGroup(ctx: ContextInterface, group: GroupInterface): Promise<void>;

    deleteUser(ctx: ContextInterface, user: UserInterface): Promise<void>;

    getGroupByGroupName(ctx: ContextInterface, groupName: string): Promise<GroupInterface | null>;

    getUserByUsername(ctx: ContextInterface, username: string): Promise<UserInterface | null>;

    getUserByRefreshToken(
        ctx: ContextInterface,
        refreshToken: string
    ): Promise<UserInterface | null>;

    listGroups(ctx: ContextInterface): Promise<readonly GroupInterface[]>;

    listUsers(ctx: ContextInterface): Promise<readonly UserInterface[]>;

    listUserGroupMembership(ctx: ContextInterface, user: UserInterface): Promise<readonly string[]>;

    updateOptions(ctx: ContextInterface, userPool: UserPool): Promise<void>;

    removeUserFromGroup(ctx: ContextInterface, group: GroupInterface, user: UserInterface): Promise<void>;

    saveGroup(ctx: ContextInterface, group: GroupInterface): Promise<void>;

    saveUser(ctx: ContextInterface, user: UserInterface): Promise<void>;

    storeRefreshToken(
        ctx: ContextInterface,
        refreshToken: string,
        user: UserInterface
    ): Promise<void>;
}

export interface UserPoolServiceFactoryInterface {
    create(
        ctx: ContextInterface,
        clientsDataStore: DataStoreInterface,
        defaultOptions: UserPool
    ): Promise<UserPoolServiceInterface>;
}

export class UserPoolServiceImpl implements UserPoolServiceInterface {
    private readonly clientsDataStore: DataStoreInterface;
    private readonly clock: ClockInterface;
    private readonly dataStore: DataStoreInterface;

    public constructor(
        clientsDataStore: DataStoreInterface,
        clock: ClockInterface,
        dataStore: DataStoreInterface,
        config: UserPool
    ) {
        this.clientsDataStore = clientsDataStore;
        this._options = config;
        this.clock = clock;
        this.dataStore = dataStore;
    }

    private _options: UserPool;

    public get options(): UserPool {
        return this._options;
    }

    public async saveAppClient(
        ctx: ContextInterface,
        appClient: AppClientInterface
    ): Promise<void> {
        ctx.logger.debug("UserPoolServiceImpl.saveAppClient");
        await this.clientsDataStore.set(
            ctx,
            ["Clients", appClient.ClientId],
            appClient
        );
    }

    public async deleteAppClient(
        ctx: ContextInterface,
        appClient: AppClientInterface
    ): Promise<void> {
        ctx.logger.debug(
            {clientId: appClient.ClientId},
            "UserPoolServiceImpl.deleteAppClient"
        );
        await this.clientsDataStore.delete(ctx, ["Clients", appClient.ClientId]);
    }

    public async deleteGroup(ctx: ContextInterface, group: GroupInterface): Promise<void> {
        ctx.logger.debug(
            {groupName: group.GroupName},
            "UserPoolServiceImpl.deleteGroup"
        );
        await this.dataStore.delete(ctx, ["Groups", group.GroupName]);
    }

    public async deleteUser(ctx: ContextInterface, user: UserInterface): Promise<void> {
        ctx.logger.debug(
            {username: user.Username},
            "UserPoolServiceImpl.deleteUser"
        );

        await this.dataStore.delete(ctx, ["Users", user.Username]);
        await this.removeUserFromAllGroups(ctx, user);
    }

    public async getGroupByGroupName(
        ctx: ContextInterface,
        groupName: string
    ): Promise<GroupInterface | null> {
        ctx.logger.debug("UserPoolServiceImpl.getGroupByGroupName");
        const result = await this.dataStore.get<GroupInterface>(ctx, ["Groups", groupName]);

        return result ?? null;
    }

    public async getUserByUsername(
        ctx: ContextInterface,
        username: string
    ): Promise<UserInterface | null> {
        ctx.logger.debug({username}, "UserPoolServiceImpl.getUserByUsername");

        const aliasEmailEnabled =
            this.options.UsernameAttributes?.includes("email");
        const aliasPhoneNumberEnabled =
            this.options.UsernameAttributes?.includes("phone_number");

        const userByUsername = await this.dataStore.get<UserInterface>(ctx, [
            "Users",
            username,
        ]);
        if (userByUsername) {
            return userByUsername;
        }

        const users = await this.dataStore.get<Record<string, UserInterface>>(
            ctx,
            "Users",
            {}
        );

        for (const user of Object.values(users)) {
            if (attributesIncludeMatch("sub", username, user.Attributes)) {
                return user;
            }

            if (
                aliasEmailEnabled &&
                attributesIncludeMatch("email", username, user.Attributes)
            ) {
                return user;
            }

            if (
                aliasPhoneNumberEnabled &&
                attributesIncludeMatch("phone_number", username, user.Attributes)
            ) {
                return user;
            }
        }

        return null;
    }

    public async getUserByRefreshToken(
        ctx: ContextInterface,
        refreshToken: string
    ): Promise<UserInterface | null> {
        ctx.logger.debug(
            {refreshToken},
            "UserPoolServiceImpl.getUserByRefreshToken"
        );
        const users = await this.listUsers(ctx);
        const user = users.find(
            (user) =>
                Array.isArray(user.RefreshTokens) &&
                user.RefreshTokens.includes(refreshToken)
        );

        return user ?? null;
    }

    public async listUsers(ctx: ContextInterface): Promise<readonly UserInterface[]> {
        ctx.logger.debug("UserPoolServiceImpl.listUsers");
        const users = await this.dataStore.get<Record<string, UserInterface>>(
            ctx,
            "Users",
            {}
        );

        return Object.values(users);
    }

    public async updateOptions(ctx: ContextInterface, userPool: UserPool): Promise<void> {
        ctx.logger.debug(
            {userPoolId: userPool.Id},
            "UserPoolServiceImpl.updateOptions"
        );
        await this.dataStore.set(ctx, "Options", userPool);
        this._options = userPool;
    }

    public async saveUser(ctx: ContextInterface, user: UserInterface): Promise<void> {
        ctx.logger.debug({user}, "UserPoolServiceImpl.saveUser");

        await this.dataStore.set<UserInterface>(ctx, ["Users", user.Username], user);
    }

    async listGroups(ctx: ContextInterface): Promise<readonly GroupInterface[]> {
        ctx.logger.debug("UserPoolServiceImpl.listGroups");
        const groups = await this.dataStore.get<Record<string, GroupInterface>>(
            ctx,
            "Groups",
            {}
        );

        return Object.values(groups);
    }

    public async addUserToGroup(
        ctx: ContextInterface,
        group: GroupInterface,
        user: UserInterface
    ): Promise<void> {
        ctx.logger.debug(
            {username: user.Username, groupName: group.GroupName},
            "UserPoolServiceImpl.addUserToFromGroup"
        );

        const groupMembers = new Set(group.members ?? []);
        if (!groupMembers.has(user.Username)) {
            groupMembers.add(user.Username);
            await this.saveGroup(ctx, {
                ...group,
                LastModifiedDate: this.clock.get(),
                members: Array.from(groupMembers),
            });
        }
    }

    public async removeUserFromGroup(
        ctx: ContextInterface,
        group: GroupInterface,
        user: UserInterface
    ): Promise<void> {
        ctx.logger.debug(
            {username: user.Username, groupName: group.GroupName},
            "UserPoolServiceImpl.removeUserFromGroup"
        );

        const groupMembers = new Set(group.members ?? []);
        if (groupMembers.has(user.Username)) {
            groupMembers.delete(user.Username);
            await this.saveGroup(ctx, {
                ...group,
                LastModifiedDate: this.clock.get(),
                members: Array.from(groupMembers),
            });
        }
    }

    async saveGroup(ctx: ContextInterface, group: GroupInterface): Promise<void> {
        ctx.logger.debug({group}, "UserPoolServiceImpl.saveGroup");

        await this.dataStore.set<GroupInterface>(ctx, ["Groups", group.GroupName], group);
    }

    async listUserGroupMembership(
        ctx: ContextInterface,
        user: UserInterface
    ): Promise<readonly string[]> {
        ctx.logger.debug(
            {username: user.Username},
            "UserPoolServiceImpl.listUserGroupMembership"
        );

        // could optimise this by dual-writing group membership to both the group and
        // the user records, but for an initial version this is probably fine unless
        // you have a lot of groups
        const groups = await this.listGroups(ctx);

        return groups
            .filter((x) => x.members?.includes(user.Username))
            .map((x) => x.GroupName)
            .sort((a, b) => a.localeCompare(b));
    }

    async storeRefreshToken(
        ctx: ContextInterface,
        refreshToken: string,
        user: UserInterface
    ): Promise<void> {
        ctx.logger.debug(
            {refreshToken, username: user.Username},
            "UserPoolServiceImpl.storeRefreshToken",
            refreshToken
        );
        const refreshTokens = Array.isArray(user.RefreshTokens)
            ? user.RefreshTokens
            : [];
        refreshTokens.push(refreshToken);

        await this.saveUser(ctx, {
            ...user,
            RefreshTokens: refreshTokens,
        });
    }

    private async removeUserFromAllGroups(
        ctx: ContextInterface,
        user: UserInterface
    ): Promise<void> {
        ctx.logger.debug(
            {username: user.Username},
            "UserPoolServiceImpl.removeUserFromAllGroups"
        );
        const groups = await this.listGroups(ctx);

        await Promise.all(
            groups.map((group) => this.removeUserFromGroup(ctx, group, user))
        );
    }
}

export class UserPoolServiceFactoryImpl implements UserPoolServiceFactoryInterface {
    private readonly clock: ClockInterface;
    private readonly dataStoreFactory: DataStoreFactoryInterface;

    public constructor(clock: ClockInterface, dataStoreFactory: DataStoreFactoryInterface) {
        this.clock = clock;
        this.dataStoreFactory = dataStoreFactory;
    }

    public async create(
        ctx: ContextInterface,
        clientsDataStore: DataStoreInterface,
        defaultOptions: UserPool
    ): Promise<UserPoolServiceInterface> {
        const id = defaultOptions.Id;

        ctx.logger.debug({id}, "UserPoolServiceImpl.create");

        const dataStore = await this.dataStoreFactory.create(ctx, id, {
            Users: {},
            Options: defaultOptions,
        });
        const config = await dataStore.get<UserPool>(
            ctx,
            "Options",
            defaultOptions
        );

        return new UserPoolServiceImpl(
            clientsDataStore,
            this.clock,
            dataStore,
            config
        );
    }
}

export const validatePermittedAttributeChanges = (
    requestAttributes: AttributeListType,
    schemaAttributes: SchemaAttributesListType
): AttributeListType => {
    for (const attr of requestAttributes) {
        const attrSchema = schemaAttributes.find((x) => x.Name === attr.Name);
        if (!attrSchema) {
            throw new InvalidParameterError(
                `user.${attr.Name}: Attribute does not exist in the schema.`
            );
        }
        if (!attrSchema.Mutable) {
            throw new InvalidParameterError(
                `user.${attr.Name}: Attribute cannot be updated. (changing an immutable attribute)`
            );
        }
    }

    if (
        attributesInclude("email_verified", requestAttributes) &&
        !attributesInclude("email", requestAttributes)
    ) {
        throw new InvalidParameterError(
            "Email is required to verify/un-verify an email"
        );
    }

    if (
        attributesInclude("phone_number_verified", requestAttributes) &&
        !attributesInclude("phone_number", requestAttributes)
    ) {
        throw new InvalidParameterError(
            "Phone Number is required to verify/un-verify a phone number"
        );
    }

    return requestAttributes;
};

export const defaultVerifiedAttributesIfModified = (
    attributes: AttributeListType
): AttributeListType => {
    const attributesToSet = [...attributes];
    if (
        attributesInclude("email", attributes) &&
        !attributesInclude("email_verified", attributes)
    ) {
        attributesToSet.push(attribute("email_verified", "false"));
    }
    if (
        attributesInclude("phone_number", attributes) &&
        !attributesInclude("phone_number_verified", attributes)
    ) {
        attributesToSet.push(attribute("phone_number_verified", "false"));
    }
    return attributesToSet;
};

export const hasUnverifiedContactAttributes = (
    userAttributesToSet: AttributeListType
): boolean =>
    attributeValue("email_verified", userAttributesToSet) === "false" ||
    attributeValue("phone_number_verified", userAttributesToSet) === "false";
