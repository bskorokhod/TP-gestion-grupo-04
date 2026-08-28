import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { BrandDetail } from "./BrandDetail";

describe("Brand Detail", () => {
  test("Renders name", async () => {
    render(<BrandDetail brand={{ id: 1, name: "Test Component" }} />);

    expect(await screen.findByText("name: Test Component")).toBeVisible();
  });

  test("Renders extra keys", async () => {
    const brandWithExtraKeys = {
      id: 1,
      name: "Test Component",
      extra: "It works!",
    };
    const { findByText } = render(<BrandDetail brand={brandWithExtraKeys} />);
    expect(await findByText(/It works!/)).toBeVisible();
  });
});
