import { describe, expect, it } from "vitest";
import { offsetForTile } from "./stream";
import { INITIAL, reduce, toRoute, type Action } from "./state";

const run = (actions: Action[]) => actions.reduce(reduce, INITIAL);

describe("reduce", () => {
  it("rapid toggles end on the last section", () => {
    const s = run([
      { type: "toggle", section: "services" },
      { type: "toggle", section: "blog" },
      { type: "toggle", section: "portfolio" },
    ]);
    expect(s).toMatchObject({
      open: "portfolio",
      item: null,
      step: 0,
      offset: 0,
    });
  });
  it("toggling the open section closes it", () =>
    expect(
      run([
        { type: "toggle", section: "blog" },
        { type: "toggle", section: "blog" },
      ]).open
    ).toBeNull());
  it("opening another section resets item, peek, dial and stream", () => {
    const s = run([
      { type: "toggle", section: "portfolio" },
      { type: "turn", by: 3 },
      { type: "scroll", by: 200 },
      { type: "item", id: "05" },
      { type: "toggle", section: "services" },
    ]);
    expect(s).toMatchObject({
      open: "services",
      item: null,
      peek: null,
      step: 0,
      offset: 0,
    });
  });
  it("peek applies only while nothing is open", () => {
    expect(run([{ type: "peek", section: "services" }]).peek).toBe("services");
    expect(
      run([
        { type: "toggle", section: "blog" },
        { type: "peek", section: "services" },
      ]).peek
    ).toBeNull();
  });
  it("opening a section clears the peek", () =>
    expect(
      run([
        { type: "peek", section: "services" },
        { type: "toggle", section: "services" },
      ]).peek
    ).toBeNull());
  it("item never moves the dial", () =>
    expect(
      run([
        { type: "toggle", section: "portfolio" },
        { type: "item", id: "09" },
      ])
    ).toMatchObject({ item: "09", step: 0 }));
  it("turn adds to the step without bounds", () =>
    expect(
      run([
        { type: "turn", by: 1 },
        { type: "turn", by: 12 },
        { type: "turn", by: -1 },
      ]).step
    ).toBe(12));
  it("scroll clamps to the stream", () => {
    expect(reduce(INITIAL, { type: "scroll", by: -50 }).offset).toBe(0);
    expect(reduce(INITIAL, { type: "scroll", by: 9999 }).offset).toBe(636);
    expect(reduce(INITIAL, { type: "offset", to: 700 }).offset).toBe(636);
  });
  it("close shuts the section and its item", () =>
    expect(
      run([
        { type: "toggle", section: "services" },
        { type: "item", id: "web-development" },
        { type: "close" },
      ])
    ).toMatchObject({
      open: null,
      item: null,
    }));
  it("switching nav closes everything", () =>
    expect(
      run([
        { type: "toggle", section: "blog" },
        { type: "nav", nav: "bar" },
      ])
    ).toMatchObject({ open: null, item: null, nav: "bar" }));
});

describe("route", () => {
  it("route to an off-dial project turns the dial to it", () =>
    expect(
      reduce(INITIAL, {
        type: "route",
        route: { open: "portfolio", item: "07" },
      })
    ).toMatchObject({
      open: "portfolio",
      item: "07",
      step: 6,
      offset: offsetForTile("p7"),
    }));
  it("route to a visible project keeps the dial still", () => {
    const s = reduce(INITIAL, { type: "toggle", section: "portfolio" });
    expect(
      reduce(s, { type: "route", route: { open: "portfolio", item: "02" } })
        .step
    ).toBe(0);
  });
  it("route to an unknown project opens the section without an item", () =>
    expect(
      reduce(INITIAL, {
        type: "route",
        route: { open: "portfolio", item: "99" },
      })
    ).toMatchObject({
      open: "portfolio",
      item: null,
      step: 0,
    }));
  it("route normalises project numbers to two digits", () =>
    expect(
      reduce(INITIAL, {
        type: "route",
        route: { open: "portfolio", item: "7" },
      }).item
    ).toBe("07"));
  it("route keeps the dial when the section stays open", () => {
    const s = run([
      { type: "toggle", section: "portfolio" },
      { type: "turn", by: 2 },
    ]);
    expect(
      reduce(s, { type: "route", route: { open: "portfolio", item: null } })
        .step
    ).toBe(2);
  });
  it("route to closed resets the dial", () => {
    const s = run([
      { type: "toggle", section: "portfolio" },
      { type: "turn", by: 2 },
    ]);
    expect(
      reduce(s, { type: "route", route: { open: null, item: null } })
    ).toMatchObject({ open: null, step: 0 });
  });
  it("toRoute mirrors open and item", () =>
    expect(
      toRoute(
        run([
          { type: "toggle", section: "about" },
          { type: "item", id: "how" },
        ])
      )
    ).toEqual({ open: "about", item: "how" }));
});
