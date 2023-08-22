/**
 * @description Function shows widget on the page
 * @param {Element} widget -  widget element
*/
function showWidget(widget) {
    if (widget.length > 0 && widget.hasClass('catch-hidden')) {
        widget.removeClass('catch-hidden');
    }
}

/**
 * @description Function hides widget on the page
 * @param {Element} widget - widget element
*/
function hideWidget(widget) {
    if (widget.length > 0 && !widget.hasClass('catch-hidden')) {
        widget.addClass('catch-hidden');
    }
}

/**
 * @description Function passes product price from PDP page to catch PDP widget
 * @param {Element} element - widget element
 *  @param {Element} priceContainter - price element
 */
function setPrice(element, priceContainter) {
    var CATCH_PRICE_LIMIT = 500000;
    element.attr('price', ' ');
    var widgetPrice = (priceContainter.text()).replace(/[^\d]*/g, '');
    element.attr('price', widgetPrice);

    if (widgetPrice > CATCH_PRICE_LIMIT) {
        hideWidget(element);
    } else {
        showWidget(element);
    }
}

/**
 * @description Function handles changes of the price attribute value in callout widget
 */
function handleWidgetProductPrice(currentPageType) {
    var widgets = $('catch-callout');
    var priceContainter;

    switch (currentPageType) {
        case 'checkout':
            priceContainter = $('.order-total > .order-value').last();
            setPrice(widgets, priceContainter.first());
            break;
        case 'set':
            var widgetCollection = widgets;

            if ($('.callout-mini-cart-wrapper catch-callout').length > 0) {
                widgetCollection = widgets.slice(1);
            }

            widgetCollection.each(function () {
                var widget = $(this);
                var parents = widget.parents('.product-set-details');
                var closestPriceElement = parents.find('.price-sales');

                setPrice(widget, closestPriceElement);
            });
            break;
        case 'bundle':
            priceContainter = $('.product-add-to-cart .product-price > .price-sales');

            setPrice(widgets, priceContainter);
            break;
        case 'product':
            var miniCartWidget = $('.callout-mini-cart-wrapper catch-callout');
            var calloutWidgets = miniCartWidget.length && widgets.length > 1 ? widgets.last() : widgets;
            priceContainter = $('#product-content .product-price > .price-sales');

            if (priceContainter.length) {
                setPrice(calloutWidgets, priceContainter);
            }
            break;
        default:
            break;
    }
}


var currentPageType;
var priceElement = $('#product-content .product-price > .price-sales');
var isSetProductPage = $('.button-fancy-medium.sub-product-item.add-to-cart').length > 0;
var isBundleProductPage = $('.button-fancy-large.add-to-cart.bundle').length > 0;
var isCheckoutPage = $('.order-total > .order-value').length > 0;

if (isCheckoutPage) {
    currentPageType = 'checkout';
} else if (isSetProductPage) {
    currentPageType = 'set';
} else if (isBundleProductPage) {
    currentPageType = 'bundle';
    priceElement = $('.product-add-to-cart .product-price > .price-sales');
} else {
    currentPageType = 'product';
}

$('body').on('DOMSubtreeModified', priceElement, function () {
    handleWidgetProductPrice(currentPageType);
});