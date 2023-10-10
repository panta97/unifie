import { Stock, StockPickingDetails, StockMoveLine } from "./../types";
import { LINE_HEIGHT, PADDING_HEIGHT } from "./constants";

export interface IStockMoveLineGrouped extends StockMoveLine {
  lineHeight: number;
}

export interface IStockPickingDetailsGrouped extends StockPickingDetails {
  page: number;
  totalPages: number;
}

export interface IStockGrouped {
  stock_picking_details: IStockPickingDetailsGrouped;
  stock_move_lines: IStockMoveLineGrouped[];
}

export interface IRowHandler {
  MAX_HEIGHT_HEADER: number;
  MAX_HEIGHT: number;
  stock: Stock;
  getGroups: () => IStockGrouped[];
}

/**
 * this class handles the grouping of order lines into tables
 */
export class RowHandler implements IRowHandler {
  MAX_HEIGHT_HEADER = 25 * 32;
  MAX_HEIGHT = 29 * 32;
  stock: Stock;
  orderGroups: IStockGrouped[] = [];
  constructor(stock: Stock) {
    this.stock = stock;
  }

  private getHeight(lineHeight: number) {
    return LINE_HEIGHT * lineHeight + PADDING_HEIGHT;
  }

  getGroups() {
    const MAX_PRODUCT_NAME_WIDTH = 75;
    // const MAX_LOCATION_WIDTH = 13;
    // const MAX_LOCATION_DEST_WIDTH = 13;
    const MAX_PRODUCT_COST_WIDTH = 8;
    const MAX_QTY_DONE_WIDTH = 8;

    this.orderGroups = [];
    let totalPages = 0;
    let page = 1;
    let accHeight = 0;
    let currStockGroup: IStockGrouped = {
      stock_picking_details: {
        ...this.stock.stock_picking_details,
        page,
        totalPages: 0,
      },
      stock_move_lines: [],
    };
    for (const stockMoveLine of this.stock.stock_move_lines) {
      const prodNameHeight = Math.ceil(
        stockMoveLine.product_name.length / MAX_PRODUCT_NAME_WIDTH
      );
      // const locationHeight = Math.ceil(
      //   stockMoveLine.location.length / MAX_LOCATION_WIDTH
      // );
      // const locationDestHeight = Math.ceil(
      //   stockMoveLine.location_dest.length / MAX_LOCATION_DEST_WIDTH
      // );
      const productCostHeight = Math.ceil(
        String(stockMoveLine.product_cost).length / MAX_PRODUCT_COST_WIDTH
      );
      const qtyDoneHeight = Math.ceil(
        String(stockMoveLine.qty_done).length / MAX_QTY_DONE_WIDTH
      );
      const lineHeight = Math.max(
        prodNameHeight,
        // locationHeight,
        // locationDestHeight,
        productCostHeight,
        qtyDoneHeight
      );
      const orderLineGroup: IStockMoveLineGrouped = {
        ...stockMoveLine,
        lineHeight,
      };
      currStockGroup.stock_move_lines.push(orderLineGroup);
      accHeight += this.getHeight(lineHeight);

      const maxHeight =
        this.orderGroups.length === 0
          ? this.MAX_HEIGHT_HEADER
          : this.MAX_HEIGHT;
      if (accHeight > maxHeight) {
        currStockGroup.stock_move_lines.pop();
        this.orderGroups.push(currStockGroup!);
        // excedent
        page++;
        totalPages += 1;
        accHeight = this.getHeight(orderLineGroup.lineHeight);
        currStockGroup = {
          stock_picking_details: {
            ...this.stock.stock_picking_details,
            page,
            totalPages: 0,
          },
          stock_move_lines: [orderLineGroup],
        };
      }
    }
    if (currStockGroup.stock_move_lines.length > 0) {
      this.orderGroups.push(currStockGroup);
      totalPages += 1;
    }
    for (const orderGroup of this.orderGroups)
      orderGroup.stock_picking_details.totalPages = totalPages;
    return this.orderGroups;
  }

  getTotalQty = () => {
    let totalQty = 0;
    for (const line of this.stock.stock_move_lines) totalQty += line.qty_done;
    return totalQty;
  };
}
