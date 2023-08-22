'use strict';

/**
 * Extension of the base module OrderModel
 * See also {@link app_storefront_base/cartridge/models/order.js}
 */
var _super = module.superModule; // eslint-disable-line no-underscore-dangle
var Resource = require('dw/web/Resource');

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    _super.call(this, lineItemContainer, options);
    this.resources.catch = {
        paymentMethod: Resource.msg('msg.payment.catch', 'catch', null)
    };
    if (lineItemContainer) {
        var totalValue = lineItemContainer.totalGrossPrice ? lineItemContainer.totalGrossPrice.value : null;
        this.order_token = Object.hasOwnProperty.call(lineItemContainer, 'orderToken') ? lineItemContainer.orderToken : null;
        this.catch = {
            catch_checkoutId: Object.hasOwnProperty.call(lineItemContainer.custom, 'catch_checkoutId') ? lineItemContainer.custom.catch_checkoutId : null,
            catch_purchaseId: Object.hasOwnProperty.call(lineItemContainer.custom, 'catch_purchaseId') ? lineItemContainer.custom.catch_purchaseId : null,
            catch_earned: Object.hasOwnProperty.call(lineItemContainer.custom, 'catch_earned') ? lineItemContainer.custom.catch_earned : null,
            priceTotalInCents: totalValue ? (Math.round(totalValue * 100)).toFixed() : 0
        };
    }
}

module.exports = OrderModel;
