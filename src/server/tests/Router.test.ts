import {TestContext} from "../../../__test_mocs__/testContext";
import {UnsupportedError} from "../../errors";
import {ServicesInterface} from "../../services";
import {Router} from "../Router";
import {Targets} from "../../targets/targets";

describe("Router", () => {
    it("returns an error handler for an invalid target", async () => {
        const services = {} as ServicesInterface;
        const route = Router(services)("invalid");

        await expect(route(TestContext, null as any)).rejects.toEqual(
            new UnsupportedError('Unsupported x-amz-target header "invalid"')
        );
    });

    it.each(Object.keys(Targets))("supports the %s target", (target) => {
        const services = {} as ServicesInterface;
        const route = Router(services)(target);

        expect(route).toBeDefined();
    });
});
