import React from "react";
import renderer from "react-test-renderer";
import { package1, package2 } from "../mocks";
import PackageDetails from "../pages/[pkg]";

describe("PackageDetails", () => {
  it("without dependencies or dependants", () => {
    const tree = renderer
      .create(<PackageDetails package={package1} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("with dependencies and dependants", () => {
    const tree = renderer
      .create(<PackageDetails package={package2} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("with dependencies only", () => {
    const tree = renderer
      .create(<PackageDetails package={{ ...package2, dependants: [] }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("with dependants only", () => {
    const tree = renderer
      .create(<PackageDetails package={{ ...package2, depends: [] }} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
