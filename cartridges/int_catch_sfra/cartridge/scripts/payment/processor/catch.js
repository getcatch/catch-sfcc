'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

/**
 * Handles a payment using  CATCH. The payment is handled by using the CATCH processor
 * @param {dw.order.Basket} basket Current users's basket
 * @return {Object} returns an error object
 */
function Handle(basket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var catchCheckoutHelper = require('*/cartridge/scripts/catch/helper/catchCheckoutHelper');

    var cardErrors = {};
    var serverErrors = [];

    var isAnyIneligibleProductsInBasket = catchCheckoutHelper.checkIneligibleProducts(basket);

    if (isAnyIneligibleProductsInBasket) {
        serverErrors.push(
            Resource.msg('error.products.ineligible', 'catch', null)
        );
        return {
            fieldErrors: cardErrors,
            serverErrors: serverErrors,
            error: true
        };
    }

    try {
        Transaction.wrap(function () {
            var paymentInstruments = basket.getPaymentInstruments();
            collections.forEach(paymentInstruments, function (item) {
                basket.removePaymentInstrument(item);
            });
            basket.createPaymentInstrument(
                'Catch', basket.totalGrossPrice
            );
        });
    } catch (e) {
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
        return {
            fieldErrors: cardErrors,
            serverErrors: serverErrors,
            error: true
        };
    }

    return {
        fieldErrors: cardErrors,
        serverErrors: serverErrors,
        error: false
    };
}

/**
 * Authorizes a payment using  CATCH. The payment is authorized by using the CATCH processor
 * @param {string} orderNumber - order number
 * @param {Object} paymentInstrument - paymentInstrument
 * @param {string} paymentProcessor - paymentProcessor
 * @returns {Object} - response
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: error
    };
}
exports.Handle = Handle;
exports.Authorize = Authorize;
