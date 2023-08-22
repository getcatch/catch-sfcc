'use strict';

var catchServiceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');

const DIRECT_CHECKOUT = 'direct';
const VIRTUAL_CARD_CHECKOUT = 'virtual_card';

/**
 * @description Getting preference for Catch
 * @param {string} id - name of preference
 * @returns {*} - value of preference
 */
function getPreference(id) {
    var { getCustomConfigValue } = require('*/cartridge/scripts/catch/helper/configHelper');
    var currentSite = require('dw/system/Site').getCurrent();
    var configValue = getCustomConfigValue(id);

    if (configValue === null || configValue === undefined) {
        return currentSite.getCustomPreferenceValue('catch_' + id);
    }
    return configValue;
}

/**
 * @description check if product variants for ineligibility
 * @param {Product} product - product
 * @returns {boolean} - is ineligible or not
 */
function checkIneligibleVariants(product) {
    if (!empty(product.variants)) {
        var variantsIter = product.variants.iterator();

        while (variantsIter.hasNext()) {
            var variant = variantsIter.next();

            if (variant.custom.catch_ineligible) {
                return true;
            }
        }
    }

    return false;
}

/**
 * @description check if product ineligible or not
 * @param {string} productId - product ID
 * @param {string} productType - product type
 * @returns {boolean} - is ineligible or not
 */
function checkIneligibleProduct(productId, productType) {
    var checkIsBundleOrSet;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var currentProduct = ProductMgr.getProduct(productId);

    if (currentProduct.custom.catch_ineligible) {
        return true;
    }

    if (checkIneligibleVariants(currentProduct)) {
        return true;
    }

    if (!productType) {
        checkIsBundleOrSet =
            currentProduct.isBundle() || currentProduct.isProductSet();
    } else {
        checkIsBundleOrSet = productType === 'bundle' || productType === 'set';
    }

    if (checkIsBundleOrSet) {
        var isBundle = productType
            ? productType === 'bundle'
            : currentProduct.isBundle();
        var bundledProducts = isBundle
            ? currentProduct.getBundledProducts()
            : currentProduct.getProductSetProducts();
        var bundledProductsIter = bundledProducts.iterator();

        while (bundledProductsIter.hasNext()) {
            var product = bundledProductsIter.next();

            if (product.custom.catch_ineligible) {
                return true;
            }

            if (checkIneligibleVariants(product)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * @description Function gets the url address to Catch SDK according to the current instance mode
 * @returns {string} - url address
 */
function getCatchSDKUrl() {
    var System = require('dw/system/System');

    return (System.getInstanceType() === System.PRODUCTION_SYSTEM)
        ? getPreference('ProductionSDKURL')
        : getPreference('SandboxSDKURL');
}

/**
 * @description Function gets the url address to Catch API according to the current instance mode
 * @returns {string} - url address
 */
function getCatchBaseUrl() {
    var System = require('dw/system/System');

    return (System.getInstanceType() === System.PRODUCTION_SYSTEM)
        ? getPreference('ProductionBaseURL')
        : getPreference('SandboxBaseURL');
}

/**
 * @description Function gets the number of rewards earned by paying with Catch
 * @param {string} orderNo - order number
 * @param {string} orderToken - order token
 * @returns {number} - earned rewards in cents
 */
function getEarnedRewards(orderNo, orderToken) {
    if (!orderNo || !orderToken) {
        return null;
    }

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNo, orderToken);

    return order.custom.catch_earned;
}

/**
 * @description get basket price total subtracted gift certificate amount
 * @param {dw.order.Basket} basket - baslet
 * @returns {dw.value.Money} - basket price total
 */
function getNonGiftCertificatePriceTotal(basket) {
    var totalPrice = basket.totalGrossPrice;
    // var totalPrice = basket.adjustedMerchandizeTotalPrice;
    var paymentInstruments = basket.getGiftCertificatePaymentInstruments();
    if (paymentInstruments && paymentInstruments.length > 0) {
        totalPrice = paymentInstruments
            .toArray()
            .reduce(function (total, paymentInstrument) {
                return total.subtract(
                    paymentInstrument.paymentTransaction.amount
                );
            }, totalPrice);
    }
    return totalPrice;
}

/**
 * @description Function gets subtotal price of current order in cents
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {number} - total price in cents
 */
function getPriceSubTotalInCents(basket) {
    if (!basket) return 0;

    var subTotal = basket.getAdjustedMerchandizeTotalPrice(false);
    if (!subTotal) return 0;

    return catchServiceHelper.moneyToCents(subTotal);
}

/**
 * @description Function gets total price of current order in cents
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {number} - total price in cents
 */
function getPriceTotalInCents(basket) {
    if (!basket) return 0;

    if (basket.totalGrossPrice && basket.totalGrossPrice.value) {
        var totalPrice = getNonGiftCertificatePriceTotal(basket);
        return catchServiceHelper.moneyToCents(totalPrice);
    }

    return getPriceSubTotalInCents(basket);
}

/**
 * convert the value of the amount in cents to a string in the money format
 * @param {number} amountInCents - the amount in cents
 * @param {string} currencyCode - currency code
 * @returns {string} - formated value
 */
function getFormatAmount(amountInCents, currencyCode) {
    var Money = require('dw/value/Money');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    var total = new Money(amountInCents / 100, currencyCode);
    return formatMoney(total);
}

/**
 * get array of customer group ID for the customer
 * @param {dw.customer.Customer} customer - customer
 * @returns {Array} - array of customer group ID
 */
function getCustomerCohort(customer) {
    var result = [];
    var customerGroups = customer.customerGroups;
    if (customerGroups && customerGroups.length > 0) {
        result = customerGroups
            .toArray()
            .filter(function (group) {
                return group.custom.catch_includeToCohorts;
            })
            .map(function (group) {
                return group.ID;
            });
    }
    return result;
}

/**
 * @description Function gets the Catch payment method type for the current basket
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {string} - Catch payment method type
 */
function getCheckoutIntegrationType(basket) {
    var prefIntegrationType = getPreference('IntegrationType').value;
    if (!basket) {
        return prefIntegrationType;
    }

    var priceTotalInCents = getPriceTotalInCents(basket);
    var paymentLimit = getPreference('VirtualIntegrationOrderTotalLimit');

    if (paymentLimit > 0 && priceTotalInCents < paymentLimit) {
        return prefIntegrationType === DIRECT_CHECKOUT ? VIRTUAL_CARD_CHECKOUT : DIRECT_CHECKOUT;
    }
    return prefIntegrationType;
}

/**
 * @description Function gets the Catch payment method type used to pay for the order
 * @param {string} orderNo - order number
 * @param {string} orderToken - order token
 * @returns {string} - Catch payment method type
 */
function getOrderIntegrationType(orderNo, orderToken) {
    if (!orderNo || !orderToken) {
        return null;
    }

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNo, orderToken);

    return order.custom.catch_integrationType;
}

module.exports = {
    getCustomerCohort: getCustomerCohort,
    getFormatAmount: getFormatAmount,
    getPreference: getPreference,
    getCatchSDKUrl: getCatchSDKUrl,
    getCatchBaseUrl: getCatchBaseUrl,
    getEarnedRewards: getEarnedRewards,
    getPriceTotalInCents: getPriceTotalInCents,
    getPriceSubTotalInCents: getPriceSubTotalInCents,
    getNonGiftCertificatePriceTotal: getNonGiftCertificatePriceTotal,
    checkIneligibleProduct: checkIneligibleProduct,
    getCheckoutIntegrationType: getCheckoutIntegrationType,
    getOrderIntegrationType: getOrderIntegrationType,
    DIRECT_CHECKOUT: DIRECT_CHECKOUT,
    VIRTUAL_CARD_CHECKOUT: VIRTUAL_CARD_CHECKOUT
};
