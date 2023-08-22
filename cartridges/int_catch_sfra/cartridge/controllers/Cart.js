'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('RemoveProductLineItem', function (req, res, next) {
    var URLUtils = require('/dw/web/URLUtils');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var viewData = res.getViewData();

    if (viewData.error) {
        res.setViewData(viewData);
        return next();
    }

    var catchCheckoutHelper = require('*/cartridge/scripts/catch/helper/catchCheckoutHelper');

    viewData.isIneligibleProductInBasket = catchCheckoutHelper.checkIneligibleProducts(currentBasket);
    res.setViewData(viewData);

    return next();
});

module.exports = server.exports();
