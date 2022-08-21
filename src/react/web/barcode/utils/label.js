const getLabel = (data, csvType) => {
  let labels = [];

  class Label {
    attrPristine(attr) {
      // Some attr are undefined, specially the ones from the migration
      if (!attr) return '';
      // Color: Negro => Negro
      return attr.split(':')[1].trim().toUpperCase();
    }

    currencyFormat(price) {
      // price can be either string or number
      return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(price);
    }

    constructor(quantity, code, desc, mCode, cats, price, attr){
      this.code = code;
      this.desc = desc;
      this.mCode = mCode;
      this.cats = cats;
      this.price = this.currencyFormat(price);
      this.attr = this.attrPristine(attr);
      this.qtt = Number(quantity);

      // Helper property after setting quantities
      // this property will be 0
      // this.quantity = Number(quantity);
    }

    addAttr(attr) {
      this.attr += ` - ${this.attrPristine(attr)}`;
    }
  }


  if (csvType === 'INGRESAR') {
    // i starts at 1 to skip the headers
    // TEMP data.length - 1 because last row length is 1
    for(let i=1; i<data.length-1; i++) {
      const row = data[i];
      /*
      row[2] => QUANTITY
      row[3] => CODE
      row[4] => DESCRIPCION
      row[5] => MANUFACTURE CODE
      row[6] => CATEGORIES
      row[7] => PRICE
      row[8] => ATTRIBUTE
      */
    if(row.slice(0,8).join('') === '') {
      // Get last pushed item
      labels[labels.length-1].addAttr(row[8]);
      } else {
        labels.push(new Label(row[2], row[3], row[4], row[5], row[6], row[7], row[8]));
      }
    }
  } else if (csvType === 'REPO-CON-ATTR') {
    // i starts at 1 to skip the headers
    // TEMP data.length - 1 because last row length is 1
    for(let i=1; i<data.length-1; i++) {
      const row = data[i];
      /*
      1 => QUANTITY
      row[1] => CODE
      row[2] => DESCRIPCION
      row[3] => MANUFACTURE CODE
      row[4] => CATEGORIES
      row[5] => PRICE
      row[6] => ATTRIBUTE
      */
    if(row.slice(0,6).join('') === '') {
      // Get last pushed item
      labels[labels.length-1].addAttr(row[6]);
      } else {
        labels.push(new Label(1, row[1], row[2], row[3], row[4], row[5], row[6]));
      }
    }
  } else if (csvType === 'REPO-SIN-ATTR') {
    // i starts at 1 to skip the headers
    // TEMP data.length - 1 because last row length is 1
    for(let i=1; i<data.length-1; i++) {
      const row = data[i];
      /*
      1 => QUANTITY
      row[1] => CODE
      row[2] => DESCRIPCION
      row[3] => MANUFACTURE CODE
      row[4] => CATEGORIES
      row[5] => PRICE
      */
    labels.push(new Label(1, row[1], row[2], row[3], row[4], row[5], ''));
    }
  } else if (csvType === 'LAMBDA') {
    // calling from lambda functions
    // json structure
    //   {
    //     "product_qty": 4.0,
    //     "barcode": "2295912744045",
    //     "name": "MUÑECA PLASTICA ARTICULABLE",
    //     "default_code": "1802-2",
    //     "categ_id": "NINA / JUGUETE / VARIOS",
    //     "lst_price": 35.0,
    //     "attribute_values": [
    //       "COLORES MANUFACTURA SI: NEGRO",
    //       "TALLA BOTTON: 32"
    //   ]
    // }
    data.forEach(lbl => {
      // if product has attributes
      let auxLabel;
      const mCode = lbl.mCode === false ? '' : lbl.mCode;
      if(lbl.attr.length > 0) {
        lbl.attr.forEach((att, i) => {
          if (!i) // if i is equal to zero
            auxLabel = new Label(lbl.quantity, lbl.code, lbl.desc, mCode, lbl.cats, lbl.price, att);
          else auxLabel.addAttr(att);
        });
      // if it doesn't
      } else auxLabel = new Label(lbl.quantity, lbl.code, lbl.desc, mCode, lbl.cats, lbl.price, '');
      labels.push(auxLabel);
    });
  }

  return labels;
}

export default getLabel;
