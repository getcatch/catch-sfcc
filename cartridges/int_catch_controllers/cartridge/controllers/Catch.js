'use strict';

var guard = require('*/cartridge/scripts/guard');
var app = require('*/cartridge/scripts/app');

var Status = require('dw/system/Status');

/**
 * handle refund calls to Catch
 */
function refund() {
    var Money = require('dw/value/Money');
    var Response = require('*/cartridge/scripts/util/Response');
    var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');
    var refundResult = null;

    var orderNo = request.httpParameterMap.order.stringValue;
    var amount = request.httpParameterMap.amount.doubleValue;
    var refundId = request.httpParameterMap.refundid.stringValue;

    if (orderNo && amount) {
        var amountMoney = new Money(amount, 'USD');
        refundResult = serviceHelper.catchRefund(orderNo, amountMoney, refundId);
    }

    Response.renderJSON({
        refund: refundResult
    });
}

/**
 * Create Catch Order
 */
function createOrder() {
    var URLUtils = require('dw/web/URLUtils');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');
    var r = require('*/cartridge/scripts/util/Response');

    // eslint-disable-next-line new-cap
    var placeOrderResult = app.getController('COPlaceOrder').Start({
        stage: 'create_order'
    });

    if (placeOrderResult.error) {
        r.renderJSON(placeOrderResult);
        return;
    }

    r.renderJSON({
        orderNo: placeOrderResult.orderNo,
        orderToken: placeOrderResult.orderToken,
        catch_checkoutId: placeOrderResult.catchCheckoutId,
        isCatchVirtualCard: placeOrderResult.isCatchVirtualCard,
        autoCloseOnConfirm: catchHelper.getPreference('autoCloseOnConfirm'),
        hideHeader: catchHelper.getPreference('hideHeader'),
        cancelURL: URLUtils.https('Catch-CancelOrder').toString(),
        continueURL: URLUtils.https('Catch-Confirm').toString()
    });
    return;
}

/**
 * Checkout used to place orders with Catch
 */
function confirm() {
    var OrderMgr = require('dw/order/OrderMgr');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');

    var orderNo = request.httpParameterMap.orderNo.stringValue;
    var orderToken = request.httpParameterMap.orderToken.stringValue;

    var order = OrderMgr.getOrder(orderNo, orderToken);

    var catchData = {
        stage: 'place_order',
        order: order
    };

    if (order.custom.catch_integrationType === catchHelper.VIRTUAL_CARD_CHECKOUT) {
        catchData.virtualCard = {
            cardNumber: request.httpParameterMap.cardNumber.stringValue,
            expirationMonth: request.httpParameterMap.expirationMonth.stringValue,
            expirationYear: request.httpParameterMap.expirationYear.stringValue,
            cvc: request.httpParameterMap.cvc.stringValue,
            zipCode: request.httpParameterMap.zipCode.stringValue
        };
    }

    // eslint-disable-next-line new-cap
    var placeOrderResult = app.getController('COPlaceOrder').Start(catchData);
    if (placeOrderResult.error) {
        // eslint-disable-next-line new-cap
        app.getController('COSummary').Start({
            PlaceOrderError: placeOrderResult.PlaceOrderError
        });
    } else if (placeOrderResult.order_created) {
        // eslint-disable-next-line new-cap
        app.getController('COSummary').ShowConfirmation(placeOrderResult.Order);
    }
}

/**
 * Controller used to include Catch widgets
 */
function includeWidget() {
    var widgetTemplate;
    var BasketMgr = require('dw/order/BasketMgr');
    var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');
    var catchCheckoutHelper = require('*/cartridge/scripts/catch/helper/catchCheckoutHelper');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');
    var currentBasket = BasketMgr.getCurrentBasket();
    var widget = request.httpParameterMap.widgetName.value;
    var payload = {
        isCatchEnabled: catchHelper.getPreference('enable'),
        catchPublicKey: catchHelper.getPreference('publicKey'),
        catchTheme: catchHelper.getPreference('theme').value
    };

    switch (widget) {
        case 'campaign':
            widgetTemplate = 'catch/catchCampaignLinkWidget';

            payload.campaignName = catchHelper.getPreference('campaignName');
            break;
        case 'payment':
            widgetTemplate = 'catch/catchPaymentMethodWidget';
            payload.priceTotalInCents = catchHelper.getPriceTotalInCents(currentBasket);
            payload.isIneligibleProductInBasket = catchCheckoutHelper.checkIneligibleProducts(currentBasket);
            break;
        case 'purchase':
            var orderNo = request.httpParameterMap.pdictOrderNo.stringValue;
            var orderToken = request.httpParameterMap.pdictOrderToken.stringValue;
            widgetTemplate = 'catch/catchPurchaseConfirmWidget';
            payload.enableWidget = catchHelper.getPreference('enableCatchConfirmationWidget');
            payload.catchEarnedRewards = catchHelper.getEarnedRewards(orderNo, orderToken);
            payload.isCatchVirtualCard = catchHelper.getOrderIntegrationType(orderNo, orderToken) === catchHelper.VIRTUAL_CARD_CHECKOUT;
            break;
        case 'callout':
            var isIneligible;
            var isOverPriceLimit;
            var page = request.httpParameterMap.page.value;
            var CATCH_PRICE_LIMIT = 500000;
            widgetTemplate = 'catch/catchCalloutWidget';

            if (page === 'cart' || page === 'minicart' || page === 'checkout') {
                payload.isPrerenderedPrice = true;
                payload.items = JSON.stringify(serviceHelper.getPLIDetailsFromLineItemCtr(currentBasket, true));
                var priceInCents = (page === 'minicart')
                    ? catchHelper.getPriceSubTotalInCents(currentBasket)
                    : catchHelper.getPriceTotalInCents(currentBasket);
                payload.priceTotalInCents = priceInCents ? priceInCents.toString() : priceInCents;
                isIneligible = catchCheckoutHelper.checkIneligibleProducts(currentBasket);
                isOverPriceLimit = payload.priceTotalInCents > CATCH_PRICE_LIMIT;
            } else {
                var productId = request.httpParameterMap.productId.value;
                isIneligible = catchHelper.checkIneligibleProduct(productId);
                payload.items = JSON.stringify(serviceHelper.getProductDetails(productId));
            }

            payload.catchOrPrefix = catchHelper.getPreference('orPrefix');
            payload.catchBorderStyle = catchHelper.getPreference('borderStyle').value;
            payload.isIneligible = isIneligible;
            payload.isOverPriceLimit = isOverPriceLimit;
            // eslint-disable-next-line no-undef
            var customerCohort = catchHelper.getCustomerCohort(customer);
            payload.catchUserCohorts = JSON.stringify(customerCohort);
            break;
        default:
            break;
    }

    app.getView(payload).render(widgetTemplate);
}

/**
 * Cancel Catch Order
 */
function cancelOrder() {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');

    var orderNo = request.httpParameterMap.orderNo.stringValue;
    var orderToken = request.httpParameterMap.orderToken.stringValue;

    var order = OrderMgr.getOrder(orderNo, orderToken);
    var COSummary = app.getController('COSummary');

    try {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
    } catch (error) {
        // eslint-disable-next-line new-cap
        COSummary.Start({
            error: true,
            PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
        });
    }

    // eslint-disable-next-line new-cap
    COSummary.Start();
}

exports.Refund = guard.ensure(['get', 'https'], refund);
exports.CreateOrder = guard.ensure(['https'], createOrder);
exports.CancelOrder = guard.ensure(['https'], cancelOrder);
exports.Confirm = guard.ensure(['https'], confirm);
exports.IncludeWidget = guard.ensure(['get', 'https'], includeWidget);
