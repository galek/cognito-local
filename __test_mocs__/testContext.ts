import { ContextInterface } from "../src/services/contextInterface";
import { MockLogger } from "./mockLogger";

export const TestContext: ContextInterface = {
  logger: MockLogger,
};
