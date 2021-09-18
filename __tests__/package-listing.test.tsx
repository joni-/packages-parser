import React from "react";
import renderer from "react-test-renderer";
import { paragraphs } from "../mocks";
import PackageListing from "../pages/index";

describe("Home", () => {
  it("renders page without changes", () => {
    const tree = renderer
      .create(<PackageListing paragraphs={paragraphs} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
