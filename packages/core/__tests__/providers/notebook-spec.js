/* eslint-disable max-len */
import React from "react";
import Immutable from "immutable";
import { Provider } from "react-redux";
import { shallow, mount } from "enzyme";

import renderer from "react-test-renderer";

import { displayOrder, transforms } from "@nteract/transforms";
import { NotebookApp } from "../../src/components/notebook-app";

import { dummyStore, dummyCommutable } from "../../src/dummy";

const dummyCellStatuses = dummyCommutable
  .get("cellOrder")
  .reduce(
    (statuses, cellID) =>
      statuses.set(
        cellID,
        Immutable.fromJS({ outputHidden: false, inputHidden: false })
      ),
    new Immutable.Map()
  );

// Boilerplate test to make sure the testing setup is configured
describe("NotebookApp", () => {
  test("accepts an Immutable.List of cells", () => {
    const stickyCells = new Immutable.Set().add(
      dummyCommutable.getIn(["cellOrder", 0])
    );

    const component = shallow(
      <NotebookApp
        cellOrder={dummyCommutable.get("cellOrder")}
        cellMap={dummyCommutable.get("cellMap")}
        transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
        cellPagers={new Immutable.Map()}
        cellStatuses={new Immutable.Map()}
        // Sticky the first cell of the notebook so that the sticky code gets
        // triggered.
        stickyCells={stickyCells}
      />
    );
    expect(component).not.toBeNull();
  });

  describe("keyDown", () => {
    test("detects a cell execution keypress", () => {
      const focusedCell = dummyCommutable.getIn(["cellOrder", 1]);

      const context = { store: dummyStore() };

      context.store.dispatch = jest.fn();
      const executeFocusedCell = jest.fn();
      const component = shallow(
        <NotebookApp
          cellOrder={dummyCommutable.get("cellOrder")}
          cellMap={dummyCommutable.get("cellMap")}
          transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
          cellPagers={new Immutable.Map()}
          cellStatuses={dummyCellStatuses}
          stickyCells={new Immutable.Set()}
          cellFocused={focusedCell}
          executeFocusedCell={executeFocusedCell}
        />,
        { context }
      );

      const inst = component.instance();

      const evt = new window.CustomEvent("keydown");
      evt.ctrlKey = true;
      evt.keyCode = 13;

      inst.keyDown(evt);

      expect(executeFocusedCell).toHaveBeenCalled();
    });
    test("detects a focus to next cell keypress", () => {
      const focusedCell = dummyCommutable.getIn(["cellOrder", 1]);

      const context = { store: dummyStore() };

      context.store.dispatch = jest.fn();
      const executeFocusedCell = jest.fn();
      const focusNextCell = jest.fn();
      const focusNextCellEditor = jest.fn();
      const component = shallow(
        <NotebookApp
          cellOrder={dummyCommutable.get("cellOrder")}
          cellMap={dummyCommutable.get("cellMap")}
          transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
          cellPagers={new Immutable.Map()}
          cellStatuses={dummyCellStatuses}
          stickyCells={new Immutable.Set()}
          cellFocused={focusedCell}
          executeFocusedCell={executeFocusedCell}
          focusNextCell={focusNextCell}
          focusNextCellEditor={focusNextCellEditor}
        />,
        { context }
      );

      const inst = component.instance();

      const evt = new window.CustomEvent("keydown");
      evt.shiftKey = true;
      evt.keyCode = 13;

      inst.keyDown(evt);

      expect(executeFocusedCell).toHaveBeenCalled();
      expect(focusNextCell).toHaveBeenCalled();
      expect(focusNextCellEditor).toHaveBeenCalled();
    });

    // TODO: This test was silently broken. It was loudly found during a refact.
    test.skip("handles a focus to next cell keypress on a sticky cell", () => {
      const focusedCell = dummyCommutable.getIn(["cellOrder", 1]);

      const context = { store: dummyStore() };

      context.store.dispatch = jest.fn();
      const executeFocusedCell = jest.fn();
      const focusNextCell = jest.fn();
      const focusNextCellEditor = jest.fn();
      const component = shallow(
        <NotebookApp
          cellOrder={dummyCommutable.get("cellOrder")}
          cellMap={dummyCommutable.get("cellMap")}
          transient={new Immutable.Map({ cellMap: new Immutable.Map() })}
          cellPagers={new Immutable.Map()}
          cellStatuses={dummyCellStatuses}
          stickyCells={new Immutable.Set([focusedCell])}
          cellFocused={focusedCell}
          executeFocusedCell={executeFocusedCell}
          focusNextCell={focusNextCell}
          focusNextCellEditor={focusNextCellEditor}
        />,
        { context }
      );

      const inst = component.instance();

      const evt = new window.CustomEvent("keydown");
      evt.shiftKey = true;
      evt.keyCode = 13;

      inst.keyDown(evt);

      expect(executeFocusedCell).toHaveBeenCalled();
      expect(focusNextCell).not.toHaveBeenCalled();
      expect(focusNextCellEditor).not.toHaveBeenCalled();
    });
  });
});
