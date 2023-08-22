'use strict';

var server = require('server');

server.get('Refund', function (req, res, next) {
    var Money = require('dw/value/Money');
    var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');
    var refundResult = null;

    var orderNo = req.querystring.order;
    var amount = req.querystring.amount;
    var refundId = req.querystring.refundid;
    amount = amount ? parseFloat(amount) : null;

    if (orderNo && amount) {
        var amountMoney = new Money(amount, 'USD');
        refundResult = serviceHelper.catchRefund(orderNo, amountMoney, refundId);
    }

    res.json({
        refund: refundResult
    });
    return next();
});

server.get('IncludeWidget', function (req, res, next) {
    var widgetTemplate;
    var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');
    var BasketMgr = require('dw/order/BasketMgr');
    var catchCheckoutHelper = require('*/cartridge/scripts/catch/helper/catchCheckoutHelper');
    var currentBasket = BasketMgr.getCurrentBasket();
    var widget = req.querystring.widgetName;
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
            var orderNo = req.querystring.pdictOrderNo;
            var orderToken = req.querystring.pdictOrderToken;
            widgetTemplate = 'catch/catchPurchaseConfirmWidget';

            payload.orderNo = orderNo;
            payload.enableWidget = catchHelper.getPreference('enableCatchConfirmationWidget');
            payload.catchEarnedRewards = catchHelper.getEarnedRewards(orderNo, orderToken);
            payload.isCatchVirtualCard = catchHelper.getOrderIntegrationType(orderNo, orderToken) === catchHelper.VIRTUAL_CARD_CHECKOUT;
            break;
        case 'callout':
            var isIneligible;
            var isOverPriceLimit;
            var page = req.querystring.page;
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
                var productId = req.querystring.productId;
                var productType = req.querystring.productType;
                payload.isPrerenderedPrice = false;
                payload.items = JSON.stringify(serviceHelper.getProductDetails(productId));
                isIneligible = catchHelper.checkIneligibleProduct(productId, productType);
            }

            payload.catchOrPrefix = catchHelper.getPreference('orPrefix');
            payload.catchBorderStyle = catchHelper.getPreference('borderStyle').value;
            payload.isIneligible = isIneligible;
            payload.isOverPriceLimit = isOverPriceLimit;
            var customerCohort = catchHelper.getCustomerCohort(req.currentCustomer.raw);
            payload.catchUserCohorts = JSON.stringify(customerCohort);
            break;
        default:
            return next();
    }

    res.render(widgetTemplate, payload);

    return next();
});

server.get('CreateOrder', function (req, res, next) {
    var Locale = require('dw/util/Locale');
    var Resource = require('dw/web/Resource');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var serviceHelper = require('*/cartridge/scripts/catch/services/serviceHelper');
    var catchHelper = require('*/cartridge/scripts/catch/helper/catchHelper');

    // Create Order
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // --- Create Catch checkout ---
    var catchIntegrationType = catchHelper.getCheckoutIntegrationType(currentBasket);
    var catchCheckoutResult = serviceHelper.createCheckout(order, catchIntegrationType);

    if (catchCheckoutResult.error) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.json(catchCheckoutResult);
        return next();
    }

    try {
        Transaction.wrap(function () {
            order.custom.catch_checkoutId = catchCheckoutResult.data.id;
            order.custom.catch_purchaseId = order.UUID;
            order.custom.catch_integrationType = catchIntegrationType;
        });
    } catch (e) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    var accountModel = new AccountModel(req.currentCustomer);
    var currentLocale = Locale.getLocale(req.locale.id);
    var orderModel = new OrderModel(
        order,
        { countryCode: currentLocale.country, containerView: 'order' }
    );

    res.json({
        error: false,
        customer: accountModel,
        order: orderModel,
        catch: {
            autoCloseOnConfirm: catchHelper.getPreference('autoCloseOnConfirm'),
            hideHeader: catchHelper.getPreference('hideHeader'),
            isCatchVirtualCard: catchIntegrationType === catchHelper.VIRTUAL_CARD_CHECKOUT
        }
    });

    return next();
});

server.post('PlaceOrder', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

    var orderNumber = req.form.orderID;
    var orderToken = req.form.orderToken;

    var order = OrderMgr.getOrder(orderNumber, orderToken);

    // Place Order
    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);

    // Handle custom processing post authorization
    var options = {
        req: req,
        res: res
    };
    var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
    if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
        res.json(postAuthCustomizations);
        return next();
    }

    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    if (req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }

    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});

server.post('CancelOrder', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');

    var orderNumber = req.form.orderID;
    var orderToken = req.form.orderToken;

    var order = OrderMgr.getOrder(orderNumber, orderToken);
    var status = true;

    try {
        Transaction.wrap(function () {
            status = OrderMgr.failOrder(order, true);
        });
    } catch (e) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', 'catch', null)
        });
        return next();
    }

    if (status.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', 'catch', null)
        });
        return next();
    }

    res.json({
        error: false
    });
    return next();
});

module.exports = server.exports();
