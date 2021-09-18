import React from "react";
import renderer from "react-test-renderer";
import { paragraph1 } from "../mocks";
import PackageDetails from "../pages/[pkg]";

describe("PackageDetails", () => {
  it("renders page without changes", () => {
    const tree = renderer
      .create(<PackageDetails paragraph={paragraph1} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
