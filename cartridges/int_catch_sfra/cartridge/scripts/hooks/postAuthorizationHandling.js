'use strict';

/**
 * This function is to handle the post payment authorization customizations
 * @param {Object} handlePaymentResult - Authorization Result
 * @param {dw.order.Order} order - Order
 * @param {Object} option - Option
 * @returns {Object} - Catch Authorization result
 */
function postAuthorization(handlePaymentResult, order, option) {
    var Resource = require('dw/web/Resource');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');
    var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');
    var catchCheckoutHelper = require('*/cartridge/scripts/catch/helper/catchCheckoutHelper');

    if (handlePaymentResult.error) {
        return {};
    }

    var paymentInstruments = order.getPaymentInstruments('Catch');
    if (paymentInstruments.length === 0) {
        return {
            success: true
        };
    }

    if (order.custom.catch_integrationType === catchHelper.VIRTUAL_CARD_CHECKOUT) {
        // --- Handle Catch Vrtual Card Checkout ---
        var virtualCard = {
            cardNumber: option.req.form.cardNumber,
            expirationMonth: option.req.form.expirationMonth,
            expirationYear: option.req.form.expirationYear,
            cvc: option.req.form.cvc,
            zipCode: option.req.form.zipCode
        };
        if (!catchCheckoutHelper.handleCatchVirtualCard(virtualCard, order)) {
            return {
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            };
        }
    } else {
        // --- Handle Catch purchase for Direct Checkout ---
        var catchPurchaseResult = serviceHelper.createPurchase(order);
        if (!catchPurchaseResult) {
            return {
                error: true,
                errorMessage: Resource.msg('error.purchase.id', 'catch', null)
            };
        }

        if (!catchCheckoutHelper.handleCatchPurchaseResponce(order, catchPurchaseResult)) {
            return {
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            };
        }
    }

    return {
        success: true
    };
}

exports.postAuthorization = postAuthorization;
