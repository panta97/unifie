const correctCodeFormat = (lblsUniq, filename) => {
  let errorHandler = {
    validCode: true,
    msgs: []
  };

  let msg = {
    code: '',
    desc: '',
    price: '',
    error: '',
  };

  if (filename === '') return errorHandler;

  for(let i=0; i < lblsUniq.length; i++) {
    msg = {
      code: lblsUniq[i].code,
      desc: lblsUniq[i].desc,
      // substring to remove S/
      price: lblsUniq[i].price.substring(3),
      error: '-',
    };
    let errorMsg = [];
    let validCode = true;

    // excel error code is 4.55395E+12
    if(/\d\.\d{5}E\+12/.test(lblsUniq[i].code)) {
      errorHandler.validCode = false;
      validCode = false;
      msg.code = lblsUniq[i].code;
      errorMsg.push('código xlsx');
    }
    // odoo error code is empty ''
    if(lblsUniq[i].code === '' || lblsUniq[i].code === false) {
      errorHandler.validCode = false;
      validCode = false;
      msg.code = '';
      errorMsg.push('código vacío');
    }
    // odoo error desc is empty ''
    if(lblsUniq[i].desc === '') {
      errorHandler.validCode = false;
      validCode = false;
      msg.desc = '';
      errorMsg.push('desc vacío');
    }
    // odoo error price is zero
    if(lblsUniq[i].price === 'S/ 0.00' || lblsUniq[i].price === 'S/ 0.00') {
      errorHandler.validCode = false;
      validCode = false;
      errorMsg.push('precio es cero');
    }

    // price is negative
    if(/^-S\/.+/.test(lblsUniq[i].price)) {
      errorHandler.validCode = false;
      validCode = false;
      errorMsg.push('precio es negativo');
    }

    if(!validCode) {
      msg.error = errorMsg.join(' - ');
      errorHandler.msgs.push(msg);
    }
  }

  return errorHandler;
}

export default correctCodeFormat;
