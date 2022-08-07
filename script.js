"use strict"

class SpreedSheet {
  rowSize = 100;
  columnSize = 100;
  /**
   * @type {{
   *   input: string,
   *   output: string,
   *   referenceList: string[]
   *   styleList: string[]
   * }}
   */
  spreadSheetData = {}
  constructor(){
    this.addProxyToSpreadSheetData()
  }

  static getInstance(){
    if(!this.instance) {
      this.instance = new SpreedSheet();
    }
    return this.instance;
  }

  getCellOutput(key){
    return this.spreadSheetData[key] ? this.spreadSheetData[key].output : "";
  }

  getCellInput(key){
    return this.spreadSheetData[key] ? this.spreadSheetData[key].input : "";
  }

  setCellValue(key, rawInput){
    this.spreadSheetData[key] = rawInput;
  }

  addProxyToSpreadSheetData(){
    this.spreadSheetData = new Proxy(this.spreadSheetData, {
      get: function(target, key){
        return target[key];
      },
      set: function(target, key, value){
        const referenceList = target.hasOwnProperty(key) ? target[key].referenceList : [];
        const styleList = target.hasOwnProperty(key) ? target[key].styleList : [];
        const cellData = {
          input: value,
          output: value,
          referenceList: referenceList,
          styleList: styleList,
        }


        document.getElementById(key).value = value;

        if(SheetTool.isFunctionExpression(value)){
          // todo calculate output
        }
        if(SheetTool.isCalculationExpression(value)){
          // todo calculate output
        }

        target[key] = cellData

        for(const reference of referenceList){
          const referenceCell = document.getElementById(reference);
          // update reference cell
        }
        return true;
      }
    })
  }

  init(){
    const that = this

    // build spreadsheet
    for (let i = 0; i < this.rowSize + 1; i++) {
      const row = document.getElementById("spread-sheet").insertRow(-1);
      if(i === 0){
        row.insertCell(-1).innerHTML = ''
        for (let j = 0; j < this.columnSize; j++) {
          row.insertCell(-1).innerHTML = SheetTool.transformNumberToLetter(j + 1);
        }
      } else {
        for (let j = 0; j < this.columnSize + 1; j++) {
          const inputEl = document.createElement('input');
          inputEl.type = 'text';
          inputEl.className = 'cell';
          inputEl.id = SheetTool.transformNumberToLetter(j) + (i);
          inputEl.onfocus = function(){
            inputEl.value = that.getCellInput(inputEl.id);
            inputEl.classList.add('cell-focus');
          }

          inputEl.onblur = function(){
            inputEl.classList.remove('cell-focus');
            inputEl.value= that.getCellOutput(inputEl.id);
          }

          inputEl.oninput = function(val){
            that.setCellValue(inputEl.id, inputEl.value);
          }

          inputEl.value = that.getCellOutput(inputEl.id);

          j===0 ? row.insertCell(-1).innerHTML = `${i}` : row.insertCell(-1).appendChild(inputEl);
        }
      }
    }
  }

}

class SheetTool {
  constructor() {
  }

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
  static isFunctionExpression(){

  }

  //todo
  static isCalculationExpression(){

  }

}

const spreadsheet = SpreedSheet.getInstance();
spreadsheet.init()
