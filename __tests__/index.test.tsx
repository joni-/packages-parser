import React from "react";
import renderer from "react-test-renderer";
import { paragraphs } from "../mocks";
import Home from "../pages/index";

describe("Home", () => {
  it("renders page without changes", () => {
    const tree = renderer.create(<Home paragraphs={paragraphs} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
