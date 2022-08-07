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

  //todo add save function
  reload() {
    this.clearTable();
    setTimeout(() => {
      this.init();
    }, 100);
  }

  clearTable() {
    const spreadSheetEl = document.getElementById("spread-sheet");
    const displayInput = DomTool.getDisplayInput();
    displayInput.value = "";
    spreadSheetEl.innerHTML = "";
  }

  sumCellsValue(cellIdList) {
    return cellIdList.reduce((sum, cellId) => {
      const cell = this.getCellData(cellId);
      //todo check if cell is number
      return sum + Number(cell.getCellOutput());
    }, 0);
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

    const refreshBtn = document.getElementById("refresh-btn");
    refreshBtn.onclick = function () {
      that.reload();
    };

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
        for (const id of this.referenceCellList) {
          const cell = this.spreadSheet.getCellData(id);
          //recalculate cell value
          cell.reCalculateOutput();
          cell.getCellElement().value = cell.getCellOutput();
        }
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

  reCalculateOutput() {
    console.log("reCalculateOutput: ", this.id);
    console.log(this.getCellInput());
    this.setCellValue(this.getCellInput());
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

        const inputUpperCase = value.toUpperCase();
        if (SheetTool.isFunctionExpression(inputUpperCase)) {
          console.log("isFunctionExpression");
          const functionName = inputUpperCase.substring(1).split("(")[0];
          const functionParams = inputUpperCase
            .substring(1)
            .split("(")[1]
            .split(")")[0]
            .split(":");
          switch (functionName) {
            case "SUM":
              const cellIdList = SheetTool.getCellIdListBetween(
                functionParams[0],
                functionParams[1]
              );
              for (const cellId of cellIdList) {
                const cell = that.spreadSheet.getCellData(cellId);
                //todo check
                if (cell.referenceCellList.indexOf(that.id) === -1) {
                  cell.addReferenceCellId(that.id);
                }
              }
              target.output = that.spreadSheet.sumCellsValue(cellIdList);
              console.log(target.output);
              break;
            case "AVG":
            case "MAX":
            case "MIN":
            default:
              target.output = "!ERROR";
              break;
          }
        }

        if (SheetTool.isCalculationExpression(inputUpperCase)) {
          const regexForBasicOperation = /[+\-*/]/;
          const operation = inputUpperCase.match(regexForBasicOperation)[0];
          const params = inputUpperCase.substring(1).split(operation);
          const cell1 = that.spreadSheet.getCellData(params[0]);
          const cell1Num = Number(cell1.getCellOutput());
          if (cell1.referenceCellList.indexOf(that.id) === -1) {
            cell1.addReferenceCellId(that.id);
          }

          const cell2 = that.spreadSheet.getCellData(params[1]);
          const cell2Num = Number(cell2.getCellOutput());
          if (cell2.referenceCellList.indexOf(that.id) === -1) {
            cell2.addReferenceCellId(that.id);
          }

          switch (operation) {
            case "+":
              target.output = cell1Num + cell2Num;
              break;
            case "-":
              target.output = cell1Num - cell2Num;
              break;
            case "*":
              target.output = cell1Num * cell2Num;
              break;
            case "/":
              target.output = cell1Num / cell2Num;
              break;
            default:
              target.output = "!ERROR";
              break;
          }
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

  static isFunctionExpression(input) {
    if (!SheetTool.isSpecialExpression(input)) {
      return false;
    }
    const inputUpperCase = input.toUpperCase();
    const regex = /^=(SUM|AVG|MIN|MAX)\(([a-zA-Z]+[0-9]+):([a-zA-Z]+[0-9]+)\)/;
    return regex.test(inputUpperCase);
  }

  static isCalculationExpression(input) {
    if (!SheetTool.isSpecialExpression(input)) {
      return false;
    }
    const inputUpperCase = input.toUpperCase();
    const regex = /^=([a-zA-Z]+[0-9]+)[+\-*/]([a-zA-Z]+[0-9]+)/;
    return regex.test(inputUpperCase);
  }

  static isSpecialExpression(input) {
    return input.startsWith("=");
  }

  static getCellIdListBetween(fromCellId, toCellId) {
    const regexMatchAlphabet = /[a-zA-Z]/g;
    const regexMatchNumber = /[0-9]/g;
    // number
    const fromRow = fromCellId.replace(regexMatchAlphabet, "");
    const toRow = toCellId.replace(regexMatchAlphabet, "");
    // alphabet
    const fromCol = fromCellId.replace(regexMatchNumber, "");
    const toCol = toCellId.replace(regexMatchNumber, "");

    const cellIdList = [];
    if (fromCol === toCol) {
      for (let i = fromRow; i <= toRow; i++) {
        for (let j = fromCol; j <= toCol; j++) {
          cellIdList.push(j + i);
        }
      }
    }

    //todo eg. b7:f7

    return cellIdList;
  }
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
