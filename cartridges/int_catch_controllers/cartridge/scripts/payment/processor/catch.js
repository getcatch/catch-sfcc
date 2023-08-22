'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

var Cart = require('*/cartridge/scripts/models/CartModel');
var catchCheckoutHelper = require('*/cartridge/scripts/catch/helper/catchCheckoutHelper');


/**
 * Handles a payment using  CATCH. The payment is handled by using the CATCH processor
 * @param {Object} args - object of arguments to work with
 * @return {Object} - error or success
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);
    var isAnyIneligibleProductsInBasket = catchCheckoutHelper.checkIneligibleProducts(cart);

    if (isAnyIneligibleProductsInBasket) {
        return {
            error: true,
            errorMessage: Resource.msg('error.products.ineligible', 'catch', null)
        };
    }

    try {
        Transaction.wrap(function () {
            cart.removeExistingPaymentInstruments('Catch');
            cart.createPaymentInstrument('Catch', cart.getNonGiftCertificateAmount());
            cart.calculate();
        });
    } catch (e) {
        return { error: true };
    }

    return { success: true };
}

/**
 * Authorizes a payment using  CATCH. The payment is authorized by using the CATCH processor
 * @param {Object} args - object of arguments to work with
 * @return {Object} - error or authorized
 */
function Authorize(args) {
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        });
    } catch (e) {
        return { error: true };
    }

    return { authorized: true };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
