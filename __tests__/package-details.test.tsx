import React from "react";
import renderer from "react-test-renderer";
import { paragraph1, paragraph2 } from "../mocks";
import PackageDetails from "../pages/[pkg]";

describe("PackageDetails", () => {
  it("without dependencies or dependants", () => {
    const tree = renderer
      .create(<PackageDetails paragraph={paragraph1} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("with dependencies and dependants", () => {
    const tree = renderer
      .create(<PackageDetails paragraph={paragraph2} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("with dependencies only", () => {
    const tree = renderer
      .create(<PackageDetails paragraph={{ ...paragraph2, dependants: [] }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("with dependants only", () => {
    const tree = renderer
      .create(<PackageDetails paragraph={{ ...paragraph2, depends: [] }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
