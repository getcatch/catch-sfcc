'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.append(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var collections = require('*/cartridge/scripts/util/collections');
        var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');

        var preViewData = res.getViewData();

        if (preViewData.error) {
            res.setViewData(preViewData);
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket) {
            Transaction.wrap(function () {
                var paymentInstruments = currentBasket.getPaymentInstruments('Catch');
                collections.forEach(paymentInstruments, function (item) {
                    currentBasket.removePaymentInstrument(item);
                });
            });
        }
        preViewData.catch = {
            autoCloseOnConfirm: catchHelper.getPreference('autoCloseOnConfirm'),
            hideHeader: catchHelper.getPreference('hideHeader')
        };
        res.setViewData(preViewData);
        return next();
    }
);

module.exports = server.exports();
