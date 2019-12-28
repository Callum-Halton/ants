import { Point } from './utils.js';
import { CellLoc } from './cell.js';
import Terrain from './terrain.js'

export default class Test {
  constructor() {
    this._assertionFailCount = 0;
    this._assertionPassCount = 0;
  }

  _assertEqual(a, b) {
    if (a !== b) {
      this._assertionFailCount += 1;
    } else {
      this._assertionPassCount += 1;
    }
  }

  _testPoint() {
    let p = new Point(25, 300);
    this._assertEqual(p.x, 25);
    this._assertEqual(p.y, 300);
  }

  _testCellLoc() {
    let c = new CellLoc(60, 22);
    this._assertEqual(c.row, 60);
    this._assertEqual(c.col, 22);
  }

  _testPointToCellLoc() {
    let p = new Point(150, 223);
    let terrain = new Terrain(1000, 1000);
    let c = terrain.pointToCellLoc(p, 26);
    this._assertEqual(c.row, 8);
    this._assertEqual(c.col, 5);
    p = new Point(30, 20);
    c = terrain.pointToCellLoc(p, 10);
    this._assertEqual(c.row, 2);
    this._assertEqual(c.col, 3);
    p = new Point(29, 19);
    c = terrain.pointToCellLoc(p, 10);
    this._assertEqual(c.row, 1);
    this._assertEqual(c.col, 2);
  }

  _testLine() {
  }

  runAll() {
    console.log("Runing all tests");
    this._testPoint();
    this._testCellLoc();
    this._testPointToCellLoc();
    this._testLine();
    let totalAssertions = this._assertionFailCount + this._assertionPassCount;
    console.log("Total assertions: " + totalAssertions);
    console.log("Total failed assertions: " + this._assertionFailCount);
    console.log("Total passed assertions: " + this._assertionPassCount);
  }
}
