import { toArray } from "rxjs/operators";

import { launchKernel } from "../src/kernel";

jest.unmock("process");

describe("Kernel", () => {
  it("can launch a kernel given a name", async done => {
    const kernel = await launchKernel("python3");
    expect(kernel.process).toBeDefined();
    expect(kernel.process.pid).toBeDefined();
    await kernel.shutdown();
    done();
  });
  it("can shutdown a kernel", async done => {
    const originalKill = process.kill;
    process.kill = jest.fn(pid => {});
    const kernel = await launchKernel("python3");
    await kernel.shutdown();
    expect(process.kill).toBeCalledWith(kernel.process.pid);
    expect(process.kill).toBeCalledTimes(1);
    process.kill = originalKill;
    kernel.process.kill();
    done();
  });
  it("creates a valid shutdown epic", async done => {
    const originalKill = process.kill;
    process.kill = jest.fn(pid => {});
    const kernel = await launchKernel("python3");
    const shutdown$ = await kernel.shutdownEpic().toPromise();
    expect(shutdown$.subscribe).toBeTruthy();
    expect(shutdown$.value).toEqual({
      status: "shutdown",
      id: kernel.id
    });
    process.kill = originalKill;
    kernel.process.kill();
    done();
  });
  it("can get usage metrics on a kernel", async done => {
    const kernel = await launchKernel("python3");
    const stats = await kernel.getUsage();
    expect(stats.memory).toBeDefined();
    expect(stats.pid).toEqual(kernel.process.pid);
    await kernel.shutdown();
    done();
  });
});
