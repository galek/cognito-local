import { Context } from "../src/services/context";
import { MockLogger } from "./mockLogger";

export const TestContext: Context = {
  logger: MockLogger,
};
