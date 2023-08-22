'use strict';

var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var logger = require('dw/system/Logger').getLogger('Catch');

/**
 * Call service, parse errors and return data or null
 * @param {dw.svc.Service} service - Service instance to call
 * @param {Object} params - Params to be passed to service.call function
 * @returns {Object} - response object or `null` in case of errors
 */
function callService(service, params) {
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');
    var result;
    var responseData = null;

    result = service.call(JSON.stringify(params));

    if (result.error >= 500) { // retry in case of 5xx failures
        var retriesApproach = catchHelper.getPreference('retriesApproach').value;

        if (retriesApproach === 'noDelay') {
            var retriesCounter = 0;
            while (result.error >= 500 && retriesCounter < 2) {
                logger.error('HTTP Service request failed.\nMessage:{0}, Url:{1} \nMaking a retry request...', result.errorMessage, service.getURL());
                retriesCounter++;
                result = service.call(JSON.stringify(params));
            }
        } else if (retriesApproach === 'delay') {
            var delayTime = catchHelper.getPreference('retriesInitialDelayTime');
            var retriesDuration = catchHelper.getPreference('retriesDuration');
            var startTime = Date.now();
            var endTime = startTime + retriesDuration;
            var retryTime = startTime + delayTime;

            while (result.error >= 500 && retryTime < endTime) {
                if (Date.now() > retryTime) {
                    logger.error('HTTP Service request failed.\nMessage:{0}, Url:{1} \nMaking a retry request...', result.errorMessage, service.getURL());
                    delayTime *= 2;
                    retryTime = Date.now() + delayTime;
                    // @TODO REMOVE AFTER TESTING START
                    /* Added for testing purposes.
                       In case service mode is changed from mocked to live during retry requests are running,
                       the last retry request will go in live mode and should return successful result
                    */
                    if (retryTime > endTime) {
                        var catchService = require('*/cartridge/scripts/catch/services/catch');
                        var currentRelativePath = service.getURL().replace('https://api-sandbox.getcatch.com/v1/', '');
                        service = catchService.init(currentRelativePath); // eslint-disable-line no-param-reassign
                    }
                    // REMOVE AFTER TESTING END
                    result = service.call(JSON.stringify(params));
                }
            }
        }
    }

    if (result.ok) {
        responseData = {
            statusCode: result.object.statusCode,
            data: {}
        };
        if (result.object.response) {
            try {
                responseData.data = JSON.parse(result.object.response);
            } catch (parseError) {
                logger.error('JSON.parse error. String:{0}', result.object.response);
            }
        }
    } else {
        logger.error('HTTP Service request failed.\nMessage:{0}, Url:{1}', result.errorMessage, service.getURL());
        responseData = {
            statusCode: result.error,
            errorMessage: result.errorMessage
        };
    }

    return responseData;
}

/**
 * Parese Cetch response error and return error message
 * @param {Object} catchResponse - Cetch response error
 * @param {string} currencyCode - Basket currency
 * @returns {Object} - parsed error message
 */
function parseResponseError(catchResponse, currencyCode) {
    var errorData;
    var result = {
        error: true,
        errorMessage: Resource.msg('error.checkout.id', 'catch', null)
    };

    if (!catchResponse || !catchResponse.errorMessage) return result;

    try {
        errorData = JSON.parse(catchResponse.errorMessage);
    } catch (e) {
        return result;
    }

    switch (errorData.error_type) {
        case 'GIFT_CARD_IN_CART':
            result.errorMessage = Resource.msg('error.checkout.gift', 'catch', null);
            break;
        case 'UNSUPPORTED_CURRENCY':
            result.errorMessage = Resource.msgf('error.checkout.currency', 'catch', null, '\'', currencyCode);
            break;
        case 'ORDER_TOTAL_EXCEEDS_MAXIMUM':
            result.errorMessage = Resource.msg('error.checkout.limit', 'catch', null);
            break;
        case 'INVALID_REQUEST':
            result.errorMessage = Resource.msg('error.checkout.request', 'catch', null);
            break;
        case 'NOT_AUTHORIZED':
            result.errorMessage = Resource.msg('error.checkout.request', 'catch', null);
            break;
        default:
            result.errorMessage = Resource.msg('error.checkout.id', 'catch', null);
            break;
    }

    return result;
}

/**
 * convert money amount to cents value
 * @param {dw.value.Money} price - Money value
 * @returns {string} - amount in cents
 */
function moneyToCents(price) {
    if (!price) return null;
    var priceValue = price.value;
    return priceValue ? Math.round(priceValue * 100) : 0;
}

/**
 * checks if current category is assigned to the site catalog
 * @param {dw.catalog.Category} currentCategory - product category
 * @param {dw.catalog.Catalog} siteCatalog - site catalog
 * @returns {boolean} - result of the check
 */
function isCategoryAssignedToSiteCatalog(currentCategory, siteCatalog) {
    if (currentCategory.parent && currentCategory.parent.ID !== 'root') {
        return isCategoryAssignedToSiteCatalog(currentCategory.parent, siteCatalog);
    }

    return siteCatalog.displayName === currentCategory.parent.displayName;
}

/**
 * decorates object with category field containing array of arrays with all categories for product item
 * @param {dw.catalog.Category} currentCategory - product category
 * @param {Object} item - item object
 * @param {Array} categoriesPath - array of category strings
 * @returns {Object} - items
 */
function getCategoryPaths(currentCategory, item, categoriesPath) {
    if (!Object.hasOwnProperty.call(item, 'category')) {
        item.category = []; // eslint-disable-line no-param-reassign
    }

    if (!categoriesPath) {
        categoriesPath = []; // eslint-disable-line no-param-reassign
    }

    categoriesPath.push(currentCategory.displayName);

    if (currentCategory.parent && currentCategory.parent.ID !== 'root') {
        return getCategoryPaths(currentCategory.parent, item, categoriesPath);
    }

    if (categoriesPath.length) {
        categoriesPath.reverse();
        item.category.push(categoriesPath);
    }

    return item;
}

/**
 * Creates the category field for items object in the POST/checkout API request
 * @param {string} pid - product ID
 * @param {Array} item - items object
 * @returns {Object} decorated object
 */
function addAllCategoriesPaths(pid, item) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var product;
    var allCategoriesList;

    if (pid) {
        product = ProductMgr.getProduct(pid);
        if (product) {
            var siteCatalog = CatalogMgr.getSiteCatalog();
            allCategoriesList = product.variant ? product.masterProduct.allCategories : product.allCategories;

            var allCategoriesListIter = allCategoriesList.iterator();

            while (allCategoriesListIter.hasNext()) {
                var currentCategory = allCategoriesListIter.next();
                if (isCategoryAssignedToSiteCatalog(currentCategory, siteCatalog)) {
                    getCategoryPaths(currentCategory, item, null);
                }
            }
        }
    }

    return item;
}

/**
 * Returns source object's field value
 * @param {any} sourceObjectField - address object
 * @param {boolean} isForm - flag indicating whether source object's field is comming a form object or not
 * @returns {Object} source object's field value
 */
function getSourceObjectFieldValue(sourceObjectField, isForm) {
    return isForm ? sourceObjectField.value : sourceObjectField;
}

/**
 * Returns full name
 * @param {any} sourceObject - address object
 * @param {boolean} isForm - flag indicating whether source object's field is comming a form object or not
 * @returns {string} full name
 */
function getFullName(sourceObject, isForm) {
    var fullName;

    if (Object.hasOwnProperty.call(sourceObject, 'fullName')) {
        fullName = sourceObject.fullName;
    } else {
        var lastName = getSourceObjectFieldValue(sourceObject.lastName, isForm);
        fullName = getSourceObjectFieldValue(sourceObject.firstName, isForm) + (lastName ? ' ' + lastName : '');
    }

    return fullName;
}

/**
 * Populate address object with data from source object
 * @param {Object} sourceObject - source object
 * @param {boolean} isForm - flag indicating whether source object is a form object or not
 * @returns {Object} object with populated fields for billing or shipping fields
 */
function populateAddressDetailsObject(sourceObject, isForm) {
    return {
        name: getFullName(sourceObject, isForm) || '',
        address_1: getSourceObjectFieldValue(sourceObject.address1, isForm) || '',
        address_2: getSourceObjectFieldValue(sourceObject.address2, isForm) || '',
        city: getSourceObjectFieldValue(sourceObject.city, isForm) || '',
        zone_code: (isForm ? sourceObject.states.state.value : sourceObject.stateCode) || '',
        country_code: (Object.hasOwnProperty.call(sourceObject, 'country') ? sourceObject.country.htmlValue : sourceObject.countryCode.value) || '',
        postal_code: (isForm ? sourceObject.postal.value : sourceObject.postalCode) || '',
        phone_number: getSourceObjectFieldValue(sourceObject.phone, isForm) || '',
        area: '' // For international addresses where needed, such as name of the suburb for NZ or village for UK.
    };
}

/**
 * Return object with address details for billing or shipping fields in the POST/checkout api request
 * @param {Object} object - cart or shippment object
 * @param {string} addressType - string indicating which type of address is currently processed
 * @returns {Object} object with populated fields for billing or shipping fields
 */
function getAddressDetails(object, addressType) {
    var siteType = Resource.msg('site.type', 'catch', null);
    if (siteType && siteType.toLowerCase() === 'sg' && object[addressType] === null) {
        var app = require('*/cartridge/scripts/app');
        var formName = addressType === 'billingAddress' ? 'billing' : 'singleshipping';
        var form = app.getForm(formName);

        return populateAddressDetailsObject(form.object[addressType].addressFields, true);
    }

    return populateAddressDetailsObject(object[addressType], false);
}

/**
 * Return array with product data object needed for callout widget
 * @param {string} productId - product ID
 * @returns {Array} array with product data object
 */
function getProductDetails(productId) {
    var ProductMgr = require('dw/catalog/ProductMgr');

    var product = ProductMgr.getProduct(productId);
    var item = {
        name: product.name,
        sku: product.ID,
        quantity: 1,
        price: {
            amount: moneyToCents(product.priceModel.price.valueOrNull ? product.priceModel.price : product.priceModel.minPrice),
            currency: // String. Currency in ISO_4217 format
                product.priceModel.price.currencyCode !== 'N/A'
                        ? product.priceModel.price.currencyCode
                        : session.currency.currencyCode // eslint-disable-line no-undef
        }
    };

    var imageItems = product.getImages('small');
    if (imageItems && imageItems.length > 0) {
        item.image_url = StringUtils.trim(imageItems[0].absURL.toString());
    }

    addAllCategoriesPaths(productId, item);

    return [item];
}

/**
 * Returns array with objects containing PLI details extracted from LineItemCtr API object
 * @param  {dw.order.Basket|dw.order.Order} lineItemCtr - current basket or order
 * @param  {boolean} isCatchCheckoutRequest - indicatites if request is made to Catch checkout api
 * @return {Array} - array with order's items
 */
function getPLIDetailsFromLineItemCtr(lineItemCtr, isCatchCheckoutRequest) {
    var items = lineItemCtr.allProductLineItems;

    return items.toArray().map(function (pli) {
        var item = {
            name: pli.productName,
            sku: pli.productID,
            quantity: pli.quantityValue,
            price: {
                amount: moneyToCents(pli.adjustedPrice.divide(pli.quantityValue)), // int. in cents
                currency: // String. Currency in ISO_4217 format
                pli.adjustedPrice.currencyCode !== 'N/A'
                        ? pli.adjustedPrice.currencyCode
                        : lineItemCtr.currencyCode
            }
        };

        if (isCatchCheckoutRequest) {
            if (empty(pli.optionID)) {
                var imageItems = pli.product.getImages('small');
                if (imageItems && imageItems.length > 0) {
                    item.image_url = StringUtils.trim(imageItems[0].absURL.toString());
                }
            } else {
                item.image_url = '';
            }

            addAllCategoriesPaths(pli.productID, item);
        }

        return item;
    });
}

/**
 * initiate the Catch checkout
 * @param {dw.order.Order} order - current from current basket
 * @param {string} integrationType - Catch payment method type used to checkout
 * @returns {Object} - catch checkout responce
 */
function createCheckout(order, integrationType) {
    var catchService = require('*/cartridge/scripts/catch/services/catch');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');

    if (!order) return null;

    var subtotal = order.getAdjustedMerchandizeTotalPrice();
    var totalPrice = catchHelper.getNonGiftCertificatePriceTotal(order);
    var currentShipment = order.shipments[0];
    var currentCustomer = order.getCustomer();

    var body = {
        amounts: {
            total: moneyToCents(totalPrice), // Int. in cents. The total amount to charge the buyer after all promotions, and fees are applied
            subtotal: moneyToCents(subtotal), // Int. in cents. The subtotal that you would like displayed to the consumer
            tax: moneyToCents(order.totalTax), // Int. in cents
            shipping: moneyToCents(order.adjustedShippingTotalPrice), // Int. in cents
            currency: order.currencyCode // Currency in ISO_4217 format
        },
        billing: getAddressDetails(order, 'billingAddress'),
        shipping: getAddressDetails(currentShipment, 'shippingAddress'),
        shipping_method: currentShipment.shippingMethod.displayName,
        items: getPLIDetailsFromLineItemCtr(order, true),
        user_cohorts: catchHelper.getCustomerCohort(currentCustomer),
        merchant_user_id: order.customer.ID, // String. The UUID of the user in the merchant's
        platform: {
            platform_type: Resource.msg('info.platform.type', 'catch', null), // Name of the platform the merchant is on (e.g., "Shopify").
            platform_version: Resource.msg('info.platform.version', 'catch', null) // Cartridge version (not Compatibility Mode value) of the merchant’s storefront.
        }
    };

    var catchCheckoutSvc = null;
    if (integrationType === catchHelper.VIRTUAL_CARD_CHECKOUT) {
        body.merchant_order_id = order.orderNo;
        catchCheckoutSvc = catchService.init('/virtual_card/checkouts');
        logger.info('Sending "create virtual card checkout" request to {0}', catchCheckoutSvc.getURL());
    } else {
        body.merchant_checkout_id = order.UUID; // String. The UUID of this checkout in the merchant's
        body.redirect_confirm_url = '';
        body.redirect_cancel_url = '';

        catchCheckoutSvc = catchService.init('/checkouts');
        logger.info('Sending "create checkout" request to {0}', catchCheckoutSvc.getURL());
    }

    var serviceResponse = callService(catchCheckoutSvc, body);

    if (serviceResponse && serviceResponse.statusCode === 201 && serviceResponse.data) {
        logger.info('Catch checkout created with ID {0}', serviceResponse.data.id);
        return {
            error: false,
            data: serviceResponse.data
        };
    }
    var currencyCode = order.getCurrencyCode();
    return parseResponseError(serviceResponse, currencyCode);
}

/**
 * confirm the purchase and to initiate the funds transfer from Catch to the merchant
 * @param {dw.order.Order} order - current basket
 * @returns {Object} - catch purchase responce
 */
function createPurchase(order) {
    var catchService = require('*/cartridge/scripts/catch/services/catch');

    if (!order
        || !Object.hasOwnProperty.call(order.custom, 'catch_checkoutId')
        || empty(order.custom.catch_checkoutId)) {
        logger.error('Error create purchase. No checkout ID in the cart');
        return null;
    }
    var body = {
        checkout_id: order.custom.catch_checkoutId, // The checkout ID that the merchant received in response to the create checkout request.
        merchant_purchase_id: order.custom.catch_purchaseId // The UUID of this purchase in the merchant's system which Catch will store for shared accounting purposes.
    };

    var catchCheckoutSvc = catchService.init('/purchases');
    logger.info('Sending "create purchases" request to {0}', catchCheckoutSvc.getURL());

    var result = callService(catchCheckoutSvc, body);
    if (result && result.data) {
        logger.info('Catch purchase created with ID {0}', result.data.id);
        return result.data;
    }
    return null;
}

/**
 * handle refund calls to Catch
 * @param {string} orderNo - order number
 * @param {string} refundAmount - amount of refund
 * @param {string} refundId - refund ID on the merchant side
 * @returns {Object} - refund result
 */
function catchRefund(orderNo, refundAmount, refundId) {
    var orderMgr = require('dw/order/OrderMgr');
    var catchService = require('*/cartridge/scripts/catch/services/catch');

    var order = orderMgr.getOrder(orderNo);
    if (!refundAmount || !order
        || !Object.hasOwnProperty.call(order.custom, 'catch_purchaseId')
        || empty(order.custom.catch_purchaseId)) return null;

    var body = {
        refund_amount: {
            amount: moneyToCents(refundAmount),
            currency: refundAmount.currencyCode
        },
        external_refund_id: refundId,
        items: getPLIDetailsFromLineItemCtr(order)
    };

    var catchCheckoutSvc = catchService.init('/purchases/' + order.custom.catch_purchaseId + '/refunds');
    logger.info('Sending "Refund" request to {0}', catchCheckoutSvc.getURL());

    var result = callService(catchCheckoutSvc, body);
    if (result && result.statusCode === 201 && result.data) {
        logger.info('Catch refund completed with ID {0}', result.data.id);
    }
    return result ? result.data : null;
}

module.exports = {
    createCheckout: createCheckout,
    createPurchase: createPurchase,
    catchRefund: catchRefund,
    moneyToCents: moneyToCents,
    getProductDetails: getProductDetails,
    getPLIDetailsFromLineItemCtr: getPLIDetailsFromLineItemCtr
};
