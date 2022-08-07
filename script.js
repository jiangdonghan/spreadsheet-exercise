"use strict";

class SpreedSheet {
  rowSize = 100;
  columnSize = 100;
  spreadSheetCellData = {};
  constructor() {}

  static getInstance() {
    if (!this.instance) {
      this.instance = new SpreedSheet();
    }
    return this.instance;
  }

  setCellData(cell) {
    this.spreadSheetCellData[cell.id] = cell;
  }

  getCellData(id) {
    return this.spreadSheetCellData[id];
  }

  init() {
    const that = this;

    const displayInput = DomTool.getDisplayInput();
    displayInput.oninput = function () {
      const id = displayInput.getAttribute("data-id");
      const cell = that.getCellData(id);
      cell.setCellValue(displayInput.value);
    };

    const styleButtons = DomTool.getButtonsForStyling();
    for (const styleButton of styleButtons) {
      styleButton.addEventListener("click", function (e) {
        const style = this.getAttribute("data-style");
        const id = this.getAttribute("data-id");
        const cell = that.getCellData(id);
        if (!cell) {
          return;
        }
        if (cell.getCellElement().classList.contains(style)) {
          cell.removeStyle(style);
        } else {
          cell.addStyle(style);
        }
      });
    }

    // build spreadsheet
    for (let i = 0; i < this.rowSize + 1; i++) {
      const row = document.getElementById("spread-sheet").insertRow(-1);
      if (i === 0) {
        row.insertCell(-1).innerHTML = "";
        for (let j = 0; j < this.columnSize; j++) {
          row.insertCell(-1).innerHTML = SheetTool.transformNumberToLetter(
            j + 1
          );
        }
      } else {
        for (let j = 0; j < this.columnSize + 1; j++) {
          let cell = this.getCellData(SheetTool.transformNumberToLetter(j) + i);
          if (!cell) {
            cell = new Cell(SpreedSheet.getInstance(), i, j);
          }
          this.setCellData(cell);
          j === 0
            ? (row.insertCell(-1).innerHTML = `${i}`)
            : row.insertCell(-1).appendChild(cell.getCellElement());
        }
      }
    }
  }
}

class Cell {
  cellValue = {
    input: "",
    output: "",
  };
  referenceCellList = [];
  constructor(spreadSheet, row, column) {
    this.spreadSheet = spreadSheet;
    this.id = SheetTool.transformNumberToLetter(column) + row;
    this.init();
  }
  getCellOutput() {
    return this.cellValue.output;
  }

  getCellInput() {
    return this.cellValue.input;
  }

  setCellValue(rawInput) {
    this.cellValue.input = rawInput;
  }

  getCellElement() {
    return this.inputEl;
  }

  addStyle(style) {
    this.getCellElement().classList.add(style);
  }

  removeStyle(style) {
    this.getCellElement().classList.remove(style);
  }

  addReferenceCellId(id) {
    this.referenceCellList.push(id);
  }

  init() {
    const displayInput = DomTool.getDisplayInput();
    const styleButtons = DomTool.getButtonsForStyling("style-btn");
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.className = "cell";
    inputEl.id = this.id;
    inputEl.onfocus = () => {
      inputEl.value = this.getCellInput();
      displayInput.value = inputEl.value;
      inputEl.classList.add("cell-focus");
      for (const styleButton of styleButtons) {
        styleButton.setAttribute("data-id", inputEl.id);
      }
    };

    inputEl.addEventListener("keypress", (e) => {
      if (e.code === "Enter") {
        inputEl.blur();
        // todo focus next cell
      }
    });

    inputEl.onblur = () => {
      inputEl.classList.remove("cell-focus");
      inputEl.value = this.getCellOutput();

      if (this.referenceCellList.length > 0) {
        // todo change other cell value
      }
    };

    inputEl.oninput = (val) => {
      displayInput.value = inputEl.value;
      this.setCellValue(inputEl.value);
      displayInput.setAttribute("data-id", inputEl.id);
    };

    inputEl.value = this.getCellOutput();
    this.inputEl = inputEl;
    this.addProxyToCellValue();
  }

  addProxyToCellValue() {
    const that = this;
    this.cellValue = new Proxy(this.cellValue, {
      get: function (target, key) {
        return target[key];
      },
      set: function (target, key, value) {
        target.input = value;
        target.output = value;

        that.getCellElement().value = value;

        if (SheetTool.isFunctionExpression()) {
          // todo calculate output and add reference to other cell
        }

        if (SheetTool.isCalculationExpression()) {
          // todo calculate output and add reference to other cell
        }

        return true;
      },
    });
  }
}

class SheetTool {
  constructor() {}

  static transformNumberToLetter(number) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let letter = "";
    while (number > 0) {
      letter = alphabet[(number - 1) % 26] + letter;
      number = Math.floor((number - 1) / 26);
    }
    return letter;
  }

  //todo
  static isFunctionExpression() {}

  //todo
  static isCalculationExpression() {}
}

class DomTool {
  constructor() {}
  static getDisplayInput() {
    return document.getElementById("display-input");
  }

  static getButtonsForStyling() {
    return document.getElementsByClassName("style-btn");
  }
}

const spreadsheet = SpreedSheet.getInstance();
spreadsheet.init();
