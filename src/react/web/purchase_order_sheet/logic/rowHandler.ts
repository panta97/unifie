import { Order, OrderDetails, OrderLine } from "./../types";
import { LINE_HEIGHT, PADDING_HEIGHT } from "./constants";

export interface IOrderLineGrouped extends OrderLine {
  lineHeight: number;
}

export interface IOrderDetailsGrouped extends OrderDetails {
  page: number;
  totalPages: number;
}

export interface IOrderGrouped {
  order_details: IOrderDetailsGrouped;
  order_lines: IOrderLineGrouped[];
}

export interface IRowHandler {
  MAX_HEIGHT_HEADER: number;
  MAX_HEIGHT: number;
  order: Order;
  getGroups: () => IOrderGrouped[];
}

/**
 * this class handles the grouping of order lines into tables
 */
export class RowHandler implements IRowHandler {
  MAX_HEIGHT_HEADER = 25 * 32;
  MAX_HEIGHT = 29 * 32;
  order: Order;
  orderGroups: IOrderGrouped[] = [];
  constructor(order: Order) {
    this.order = order;
  }

  private getHeight(lineHeight: number) {
    return LINE_HEIGHT * lineHeight + PADDING_HEIGHT;
  }

  getGroups() {
    const MAX_DESC_WIDTH = 61;
    const MAX_BRAND_WIDTH = 13;
    const MAX_QTY_WIDTH = 4;

    this.orderGroups = [];
    let totalPages = 0;
    let page = 1;
    let accHeight = 0;
    let currOrderGroup: IOrderGrouped = {
      order_details: { ...this.order.order_details, page, totalPages: 0 },
      order_lines: [],
    };
    for (const orderLine of this.order.order_lines) {
      const descHeight = Math.ceil(orderLine.name.length / MAX_DESC_WIDTH);
      const brandHeight = Math.ceil(
        orderLine.cats.split(" / ")[2].length / MAX_BRAND_WIDTH
      );
      const qtyHeight = Math.ceil(
        String(orderLine.quantity).length / MAX_QTY_WIDTH
      );
      const lineHeight = Math.max(descHeight, brandHeight, qtyHeight);
      const orderLineGroup: IOrderLineGrouped = {
        ...orderLine,
        lineHeight,
      };
      currOrderGroup.order_lines.push(orderLineGroup);
      accHeight += this.getHeight(lineHeight);

      const maxHeight =
        this.orderGroups.length === 0
          ? this.MAX_HEIGHT_HEADER
          : this.MAX_HEIGHT;
      if (accHeight > maxHeight) {
        currOrderGroup.order_lines.pop();
        this.orderGroups.push(currOrderGroup!);
        // excedent
        page++;
        totalPages += 1;
        accHeight = this.getHeight(orderLineGroup.lineHeight);
        currOrderGroup = {
          order_details: { ...this.order.order_details, page, totalPages: 0 },
          order_lines: [orderLineGroup],
        };
      }
    }
    if (currOrderGroup.order_lines.length > 0) {
      this.orderGroups.push(currOrderGroup);
      totalPages += 1;
    }
    for (const orderGroup of this.orderGroups)
      orderGroup.order_details.totalPages = totalPages;
    return this.orderGroups;
  }

  getTotalQty = () => {
    let totalQty = 0;
    for (const line of this.order.order_lines) totalQty += line.quantity;
    return totalQty;
  };
}
