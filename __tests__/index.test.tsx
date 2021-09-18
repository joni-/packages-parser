import React from "react";
import renderer from "react-test-renderer";
import Home from "../pages/index";

describe("Home", () => {
  it("renders page without changes", () => {
    const tree = renderer.create(<Home />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
