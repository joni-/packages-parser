import React from "react";
import renderer from "react-test-renderer";
import { packages } from "../mocks";
import PackageListing from "../pages/index";

describe("PackageListing", () => {
  it("renders page without changes", () => {
    const tree = renderer
      .create(<PackageListing packages={packages} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
