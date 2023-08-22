'use strict';

/**
 * @description Function forms object with prefilled data for Catch checkout widget
 * @param  {Object} data - data passed from ajax request
 * @returns {Object} - object with prefilled data
 */
function getCatchPrefilledData(data) {
    var prefilledData;

    if (!data.customer.registeredUser) {
        prefilledData = {
            userPhone: data.order.billing.billingAddress.address.phone,
            userName: data.order.billing.billingAddress.address.firstName + ' ' + data.order.billing.billingAddress.address.lastName,
            userEmail: data.order.orderEmail
        };
    } else {
        prefilledData = {
            userPhone: data.customer.profile.phone,
            userName: data.customer.profile.firstName + ' ' + data.customer.profile.lastName,
            userEmail: data.customer.profile.email
        };
    }

    return prefilledData;
}

/**
 * @description Function initializes Catch SDK
 * @param {string} pageType - type of page where catch SDK is initialized
 * @param {string} catchCheckoutID - Catch checkout ID
 * @param {Object} option - specifying a value for options
 * @param {boolean} isCatchVirtualCard - Catch Virtual card checkout
 */
function initializeCatchSDK(pageType, catchCheckoutID, option, isCatchVirtualCard) {
    var publicKey = $('.catch-data').data('key');

    if (!publicKey) {
        return;
    }

    try {
        var result = catchjs.init(publicKey, { // eslint-disable-line no-undef
            pageType: pageType || 'unknown'
        }).then(function (promise) {
            if ($('#catch-payment-tab').length > 0) {
                $('#catch-payment-tab').removeClass('catch-tab-hidden');
            }
            return promise;
        }).catch(function () {
            return;
        });

        if (catchCheckoutID && option) {
            if (isCatchVirtualCard) {
                result.then(function (catchHandle) {
                    window.catchHandle = catchHandle;
                    catchHandle.openVirtualCardCheckout(catchCheckoutID, option);
                });
            } else {
                result.then(function (catchHandle) {
                    window.catchHandle = catchHandle;
                    catchHandle.openCheckout(catchCheckoutID, option);
                });
            }
        }
    } catch (e) {
        return;
    }
}

/**
 * @description Function shows widget on the page
 * @param {Element} widget - widget element
 * @param {string} className - class name to remove
*/
function showWidget(widget, className) {
    className = className || 'callout-disabled'; // eslint-disable-line no-param-reassign
    if (widget.length > 0 && widget.hasClass(className)) {
        widget.removeClass(className);
    }
}

/**
 * @description Function hides widget on the page
 * @param {Element} widget - widget element
 * @param {string} className - class name to add
*/
function hideWidget(widget, className) {
    className = className || 'callout-disabled'; // eslint-disable-line no-param-reassign
    if (widget.length > 0 && !widget.hasClass(className)) {
        widget.addClass(className);
    }
}

/**
 * @description Function sets price attribute value to callout widget
 * @param {Element} element - widget element
 * @param {Element | number} priceContainter - price element
 * @param {Element} qauntityContainer - quantity container element
 */
function setPrice(element, priceContainter, qauntityContainer) {
    var CATCH_PRICE_LIMIT = 500000;
    var qauntity = qauntityContainer ? +qauntityContainer.attr('value') || 1 : 1;
    var widgetPrice =
        priceContainter instanceof jQuery
            ? (+priceContainter.attr('content') * 100).toFixed()
            : priceContainter;

    element.attr('price', ' ');
    element.attr('price', widgetPrice * qauntity);

    if (widgetPrice > CATCH_PRICE_LIMIT) {
        hideWidget(element, 'catch-hidden');
    } else {
        showWidget(element, 'catch-hidden');
    }
}

/**
 * @description Function gets element that contains available product quantity
 * @param {Element} parent - parent element
 * @returns {Element} - quantity container element
 */
function getQuantityContainerElement(parent) {
    return parent.find('.quantity-select > option:selected');
}

/**
 * @description Function clears price value from dollar signs and dots
 * @param {string} price - price value
 * @returns {number} - price in cents
 */
function getPriceInCents(price) {
    return +price.replace(/[^\d]*/g, '');
}

/**
 * @description Function sets items attribute value to callout widget
 * @param {string} itemsData - stringified items data
 * @param {Element} widgets - callout widgets
 */
function setItemsAttribute(itemsData, widgets) {
    widgets = widgets || $('catch-callout'); // eslint-disable-line no-param-reassign
    widgets.attr('items', itemsData);
}

/**
 * @description Function updates widget's price attribute value on cart and minicart
 * @param {string} cartTotals - cart totals
 */
function updateCartWidgets(cartTotals) {
    var miniCartWidget = $('.callout-mini-cart-wrapper catch-callout');
    var cartTotalsWidget = $('.totals catch-callout');

    setPrice(miniCartWidget, getPriceInCents(cartTotals.subTotal));
    if (cartTotalsWidget.length) {
        setPrice(cartTotalsWidget, getPriceInCents(cartTotals.grandTotal));
    }
    setItemsAttribute(cartTotals.catchItems, $(miniCartWidget, cartTotalsWidget));
}

/**
 * @description Function updates widget's items attribute value on PDP
 * @param {Object} response - server's response with product data after product attribute was changed on PDP
 */
function updateItemsAttributePDP(response) {
    var widget = response.container.find('catch-callout');
    var itemsAttributeCurrentData = JSON.parse(widget.attr('items'))[0];
    var productData = response.data.product;
    var productPriceData = productData.price.sales ? productData.price.sales : productData.price.min.sales;

    var item = {
        name: productData.productName,
        sku: productData.id,
        quantity: productData.selectedQuantity,
        price: {
            amount: productPriceData.value * 100,
            currency: productPriceData.currency // String. Currency in ISO_4217 format
        },
        category: itemsAttributeCurrentData.category
    };

    var imageItems = productData.images.small;
    if (imageItems && imageItems.length > 0) {
        item.image_url = imageItems[0].absURL;
    }

    setItemsAttribute(JSON.stringify([item]), widget);
}


/**
 * @description Function handles changes of the price on PDP page
 */
function handleWidgetPriceAttributeValue() {
    var priceContainter;
    var widgets = $('catch-callout');

    var isSetProductPage = $('.product-detail.product-set-detail').length > 0;
    var isCartOrCheckoutPage = $('.grand-total').length > 0;

    if (isCartOrCheckoutPage) {
        priceContainter = $('.grand-total');
        var widgetPrice = (priceContainter.text()).replace(/[^\d]*/g, '');
        setPrice(widgets, widgetPrice);

        var paymentWidget = $('catch-payment-method');
        if (paymentWidget.length > 0) {
            setPrice(paymentWidget, widgetPrice);
        }
    } else if (isSetProductPage) {
        var widgetCollection = widgets;

        if ($('.callout-mini-cart-wrapper catch-callout').length > 0) {
            widgetCollection = widgets.slice(1);
        }

        widgetCollection.each(function () {
            var widget = $(this);
            var parents = widget.parents('.row');
            var closestPriceElement = parents.find('.sales > .value');

            if (closestPriceElement.length > 1) {
                closestPriceElement = closestPriceElement.first();
            }
            setPrice(widget, closestPriceElement, getQuantityContainerElement(parents));
        });
    } else {
        if ($('.callout-mini-cart-wrapper catch-callout').length > 0) {
            widgets = widgets.slice(1);
        }

        var parent = widgets.parents('.row').last();
        priceContainter = parent.find('.sales > .value');
        setPrice(widgets, priceContainter, getQuantityContainerElement(parent));
    }
}

/**
 * @description Function initializes price attribute value handling for Catch widgets
 */
function onWidgetPriceAttributeChange() {
    var isPrerenderedPrice;
    if ($('.grand-total').length > 0) {
        isPrerenderedPrice = false;
    } else if ($('.grand-total-sum').length > 0) {
        isPrerenderedPrice = true;
    } else {
        isPrerenderedPrice = false;
    }

    if (!isPrerenderedPrice) {
        handleWidgetPriceAttributeValue();
    }
}

module.exports = {
    getCatchPrefilledData: getCatchPrefilledData,
    initializeCatchSDK: initializeCatchSDK,
    onWidgetProductPriceChange: onWidgetPriceAttributeChange,
    updateCartWidgets: updateCartWidgets,
    showWidget: showWidget,
    hideWidget: hideWidget,
    setItemsAttribute: setItemsAttribute,
    updateItemsAttributePDP: updateItemsAttributePDP
};
