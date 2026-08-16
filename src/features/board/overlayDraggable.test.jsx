// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { TokenOverlay } from "./TokenOverlay.jsx";
import { DoorOverlay } from "./DoorOverlay.jsx";
import { SearchMarkerOverlay } from "./SearchMarkerOverlay.jsx";
import { SecretDoorMarkerOverlay } from "./SecretDoorMarkerOverlay.jsx";

afterEach(() => cleanup());

const getTokenPos = (col, row) => [col * 37, row * 37];

function expectNotDraggable(img) {
  expect(img).toBeTruthy();
  expect(img.draggable).toBe(false);
  expect(img.style.WebkitTouchCallout).toBe("none");
}

describe("overlay <img> elements are not natively draggable (pan-drag compatibility)", () => {
  it("TokenOverlay — image piece (goblin)", () => {
    const { container } = render(
      <TokenOverlay
        anchorKey="1,1" type="goblin" coveredCells={["1,1"]} rotation={0}
        fog={new Set(["1,1"])} isEditMode={false} getTokenPos={getTokenPos} tileSet="board2"
      />
    );
    expectNotDraggable(container.querySelector("img"));
  });

  it("TokenOverlay — trap warning image", () => {
    const { container } = render(
      <TokenOverlay
        anchorKey="1,1" type="trap" coveredCells={["1,1"]} rotation={0}
        fog={new Set(["1,1"])} isEditMode={false} getTokenPos={getTokenPos} tileSet="board2"
        revealedTraps={new Set()}
      />
    );
    expectNotDraggable(container.querySelector("img"));
  });

  it("TokenOverlay — note marker image", () => {
    const { container } = render(
      <TokenOverlay
        anchorKey="1,1" type="notemarker" coveredCells={["1,1"]} rotation={0}
        fog={new Set(["1,1"])} isEditMode={false} getTokenPos={getTokenPos} tileSet="board2"
        note="hello"
      />
    );
    expectNotDraggable(container.querySelector("img"));
  });

  it("DoorOverlay", () => {
    const { container } = render(
      <DoorOverlay
        anchorKey="1,1" rotation={0} type="door"
        fog={new Set(["1,1"])} isEditMode={true} getTokenPos={getTokenPos}
        hasCalibration={false} tileSet="board2"
      />
    );
    expectNotDraggable(container.querySelector("img"));
  });

  it("SearchMarkerOverlay", () => {
    const { container } = render(
      <SearchMarkerOverlay
        searchMarkers={{ R1: [1, 1] }} searchNotes={{}} searchedCounts={{}}
        fog={new Set(["1,1"])} isEditMode={false} getTokenPos={getTokenPos}
        onEditNote={() => {}} onViewNote={() => {}}
      />
    );
    expectNotDraggable(container.querySelector("img"));
  });

  it("SecretDoorMarkerOverlay", () => {
    const { container } = render(
      <SecretDoorMarkerOverlay
        secretDoorMarkers={{ "1,1": { linkedDoorKey: null, message: "" } }}
        placed={{}} fog={new Set(["1,1"])} isEditMode={false} getTokenPos={getTokenPos}
        onEditConfig={() => {}} onSearch={() => {}}
      />
    );
    expectNotDraggable(container.querySelector("img"));
  });
});
