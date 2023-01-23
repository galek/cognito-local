import { MockLogger } from "./mockLogger";
import { ContextInterface } from "../src/interfaces/services/context.interface";

export const TestContext: ContextInterface = {
  logger: MockLogger,
};
