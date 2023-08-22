'use strict';

/**
 * Checks if basket contains ineligible products
 * @param {Object} basket - current basket
 * @returns {boolean} result
 */
function checkIneligibleProducts(basket) {
    if (!basket) {
        return false;
    }

    if (!basket.getGiftCertificateLineItems().isEmpty()) {
        return true;
    }

    var productLineItems = basket.getAllProductLineItems().toArray();
    var isIneligibleProductsInBasket = productLineItems.some(function (pli) {
        return pli.product ? pli.product.custom.catch_ineligible : false;
    });

    return isIneligibleProductsInBasket;
}

/**
 * Converts basket line items into a string snapshot
 * @param {dw.order.Basket} basket current basket
 * @returns {string} representing all basket line items and their price
 */
function createBasketStateSnapshot(basket) {
    return basket.getAllLineItems()
        .toArray()
        .map(function (item) {
            return item.constructor.name
                + '(' + item.getUUID() + '):'
                + item.getPriceValue()
                + ((item instanceof dw.order.ProductLineItem) ? '(' + item.quantity.value + ')' : '');
        })
        .sort()
        .join('|');
}

/**
 * Converts basket line items into a string snapshot
 * @param {dw.order.Basket} basket current basket
 */
function updateBasketStateSnapshot(basket) {
    var Transaction = require('dw/system/Transaction');
    if (basket) {
        var currentBasket = basket;
        Transaction.wrap(function () {
            currentBasket.custom.catch_basketState = createBasketStateSnapshot(currentBasket);
        });
    }
}

/**
 * Checks wether existing checkout data is valid for current basket
 * @param {dw.order.Basket} currentBasket current basket
 * @returns {boolean} if checkout data is not valid for current basket
 */
function basketStateIsValid(currentBasket) {
    return currentBasket.custom.catch_basketState === createBasketStateSnapshot(currentBasket);
}

/**
 * Handle Catch create purchase responce for Direct checkout
 * @param {dw.order.Order} order - current order
 * @param {Object} catchPurchaseResponce - Catch create purchase responce
 * @returns {boolean} - success handle
 */
function handleCatchPurchaseResponce(order, catchPurchaseResponce) {
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');
    var constants = require('*/cartridge/scripts/catch/constants');

    var paymentInstruments = order.getPaymentInstruments('Catch');
    var paymentInstrument = paymentInstruments.length === 0 ? null : paymentInstruments[0];
    var currentOrder = order;

    try {
        Transaction.wrap(function () {
            var appliedRewards = catchPurchaseResponce.applied_rewards;

            currentOrder.custom.catch_earned = catchPurchaseResponce.earned_rewards;
            currentOrder.custom.catch_applied_rewards = appliedRewards;
            currentOrder.custom.catch_purchaseId = catchPurchaseResponce.id;

            if (appliedRewards) {
                var paymentTransaction = paymentInstrument.getPaymentTransaction();
                var rewardsAdjustment = currentOrder.createPriceAdjustment(constants.rewardsAdjustmentID);

                rewardsAdjustment.setPriceValue(-appliedRewards / 100);
                rewardsAdjustment.updateTax(0);
                rewardsAdjustment.setLineItemText(Resource.msg('label.order.rewards.adjustment', 'catch', null));

                currentOrder.updateTotals();
                paymentTransaction.setAmount(catchHelper.getNonGiftCertificatePriceTotal(currentOrder));
            }
        });
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Handle Catch Virtual Card data
 * @param {Object} virtualCard - Catch Virtual Card data
 * @returns {boolean} - success handle
 */
function handleCatchVirtualCard(virtualCard) {
    var { cardNumber, expirationMonth, expirationYear, cvc, zipCode } = virtualCard;

    // Add virtual credit card processing code instead of logger
    var logger = require('dw/system/Logger').getLogger('Catch', 'Catch.VirtualCard');
    logger.info('Card number: {0}, Exp.date {1}/{2}, CVC: {3}, Zip Code: {4}',
        cardNumber, expirationMonth, expirationYear, cvc, zipCode);
    // ---------------------------------------------------------

    return true;
}

module.exports = {
    checkIneligibleProducts: checkIneligibleProducts,
    updateBasketStateSnapshot: updateBasketStateSnapshot,
    basketStateIsValid: basketStateIsValid,
    handleCatchPurchaseResponce: handleCatchPurchaseResponce,
    handleCatchVirtualCard: handleCatchVirtualCard
};
