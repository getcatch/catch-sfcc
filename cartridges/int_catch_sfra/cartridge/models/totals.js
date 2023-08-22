'use strict';

var parent = module.superModule;

var formatMoney = require('dw/util/StringUtils').formatMoney;
var constants = require('*/cartridge/scripts/catch/constants');
var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');

/**
 * Gets the order discount amount by subtracting the basket's total including the discount from
 * the basket's total excluding the order discount.
 * Catch rewards adjustment amount will not be included to the order discount amount
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @param {dw.value.Money} rewardsAdjustmentPrice - Catch rewards adjustment price amount
 * @returns {Object} an object that contains the value and formatted value of the order discount
 */
function getOrderLevelDiscountWithoutRewardsAdjustment(lineItemContainer, rewardsAdjustmentPrice) {
    var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.add(rewardsAdjustmentPrice).subtract(totalIncludingOrderDiscount);

    return {
        value: orderDiscount.value,
        formatted: formatMoney(orderDiscount)
    };
}

/**
 * Extends totals calculation model to handle possible Catch rewards price adjustment
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function Totals(lineItemContainer) {
    parent.apply(this, arguments);

    if (catchHelper.getPreference('enable')) {
        var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');

        var rewardsAdjustment = lineItemContainer.getPriceAdjustmentByPromotionID(constants.rewardsAdjustmentID);
        if (rewardsAdjustment) {
            var rewardsAdjustmentPrice = rewardsAdjustment.getPrice();
            this.appliedRewards = formatMoney(rewardsAdjustmentPrice);
            this.orderLevelDiscountTotal = getOrderLevelDiscountWithoutRewardsAdjustment(lineItemContainer, rewardsAdjustmentPrice);
        }

        this.catchItems = JSON.stringify(serviceHelper.getPLIDetailsFromLineItemCtr(lineItemContainer, true));
    }
}

module.exports = Totals;
