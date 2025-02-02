import * as AWS from "aws-sdk";
import fs from "fs";
import http from "http";
import type { Logger } from "pino";
import { promisify } from "util";
import { createServer } from "../../src";
import { FakeMessageDeliveryService } from "../../__test_mocs__/FakeMessageDeliveryService";
import { MockLogger } from "../../__test_mocs__/mockLogger";
import { DefaultConfig } from "../../src/server/configInterface";
import {
  ClockInterface,
  DateClock,
  MessagesService,
  TriggersService,
} from "../../src/services";
import { CognitoServiceFactoryImpl } from "../../src/services/cognitoService";
import { NoOpCache } from "../../src/services/dataStore/cache";
import { DataStoreFactoryInterface } from "../../src/services/dataStore/factory";
import { StormDBDataStoreFactory } from "../../src/services/dataStore/stormDb";
import { otp } from "../../src/services/otp";
import { JwtTokenGenerator } from "../../src/services/tokenGeneratorInterface";
import { UserPoolServiceFactoryImpl } from "../../src/services/userPoolServiceInterface";
import { Router } from "../../src/server/Router";
import { CryptoService } from "../../src/services/crypto";

const mkdtemp = promisify(fs.mkdtemp);
const rmdir = promisify(fs.rmdir);

export const withCognitoSdk =
  (
    fn: (
      cognito: () => AWS.CognitoIdentityServiceProvider,
      services: {
        readonly dataStoreFactory: () => DataStoreFactoryInterface;
        readonly messageDelivery: () => FakeMessageDeliveryService;
      }
    ) => void,
    {
      logger = MockLogger as any,
      clock = new DateClock(),
    }: { logger?: Logger; clock?: ClockInterface } = {}
  ) =>
  () => {
    let dataDirectory: string;
    let httpServer: http.Server;
    let cognitoSdk: AWS.CognitoIdentityServiceProvider;
    let dataStoreFactory: DataStoreFactoryInterface;
    let fakeMessageDeliveryService: FakeMessageDeliveryService;

    beforeEach(async () => {
      dataDirectory = await mkdtemp("/tmp/cognito-local:");
      const ctx = { logger };

      dataStoreFactory = new StormDBDataStoreFactory(
        dataDirectory,
        new NoOpCache()
      );
      const cognitoServiceFactory = new CognitoServiceFactoryImpl(
        dataDirectory,
        clock,
        dataStoreFactory,
        new UserPoolServiceFactoryImpl(clock, dataStoreFactory)
      );
      const cognitoClient = await cognitoServiceFactory.create(ctx, {});
      const triggers = new TriggersService(
        clock,
        cognitoClient,
        {
          enabled: jest.fn().mockReturnValue(false),
          invoke: jest.fn(),
        },
        new CryptoService({ KMSKeyId: "", KMSKeyAlias: "" })
      );

      fakeMessageDeliveryService = new FakeMessageDeliveryService();
      const router = Router({
        clock,
        cognito: cognitoClient,
        config: DefaultConfig,
        messages: new MessagesService(triggers, fakeMessageDeliveryService),
        otp,
        triggers,
        tokenGenerator: new JwtTokenGenerator(
          clock,
          triggers,
          DefaultConfig.TokenConfig
        ),
      });
      const server = createServer(router, ctx.logger);
      httpServer = await server.start({
        port: 0,
      });

      const address = httpServer.address();
      if (!address) {
        throw new Error("HttpServer has no address");
      }
      const url =
        typeof address === "string"
          ? address
          : `${address.address}:${address.port}`;

      cognitoSdk = new AWS.CognitoIdentityServiceProvider({
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
        region: "local",
        endpoint: `http://${url}`,
      });
    });

    fn(() => cognitoSdk, {
      dataStoreFactory: () => dataStoreFactory,
      messageDelivery: () => fakeMessageDeliveryService,
    });

    afterEach((done) => {
      httpServer.close(() => {
        rmdir(dataDirectory, {
          recursive: true,
        }).then(done, done);
      });
    });
  };
