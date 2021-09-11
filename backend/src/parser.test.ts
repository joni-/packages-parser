import { add } from "./parser";

describe("add", () => {
  it("1 + 2", () => {
    expect(add(1, 2)).toBe(3);
  });
});
