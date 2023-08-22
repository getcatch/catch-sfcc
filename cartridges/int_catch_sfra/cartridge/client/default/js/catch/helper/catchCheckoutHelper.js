'use strict';

/**
 * @description Cancel Order and restore the Basket
 * @param {string} orderID - Order number
 * @param {string} orderToken - Order token
 * @returns {promise} - Deferred promice
 */
function catchCancelOrder(orderID, orderToken) {
    var deferCancel = $.Deferred(); // eslint-disable-line
    $.ajax({
        url: $('.place-order').data('catch-cancel-order-url'),
        method: 'POST',
        data: {
            orderID: orderID,
            orderToken: orderToken
        },
        success: function (data) {
            if (data.error) {
                deferCancel.reject(data);
            } else {
                deferCancel.resolve(data);
            }
        },
        error: function (err) {
            deferCancel.reject(err.responseJSON);
        }
    });
    return deferCancel.promise();
}

/**
 * @description Place Catch Order and update SFCC Order
 * @param {string} orderID - order Number
 * @param {string} orderToken - order token
 * @param {Object} cardDetails - Catch virtual card detail
 * @returns {promise} - Deferred promice
 */
function catchPlaceOrder(orderID, orderToken, cardDetails) {
    var deferPlace = $.Deferred(); // eslint-disable-line
    var catchData = {
        orderID: orderID,
        orderToken: orderToken
    };

    if (cardDetails) {
        catchData.cardNumber = cardDetails.card_number;
        catchData.expirationMonth = cardDetails.expiration_month;
        catchData.expirationYear = cardDetails.expiration_year;
        catchData.cvc = cardDetails.cvc;
        catchData.zipCode = cardDetails.zip_code;
    }

    $.ajax({
        url: $('.place-order').data('catch-place-order-url'),
        method: 'POST',
        data: catchData,
        success: function (data) {
            if (data.error) {
                deferPlace.reject(data);
            } else {
                var redirect = $('<form>')
                .appendTo(document.body)
                .attr({
                    method: 'POST',
                    action: data.continueUrl
                });
                $('<input>')
                    .appendTo(redirect)
                    .attr({
                        name: 'orderID',
                        value: data.orderID
                    });
                $('<input>')
                    .appendTo(redirect)
                    .attr({
                        name: 'orderToken',
                        value: data.orderToken
                    });
                redirect.submit();
                deferPlace.resolve(data);
            }
        },
        error: function (err) {
            deferPlace.reject(err.responseJSON);
        }
    });
    return deferPlace.promise();
}

module.exports = {
    catchCancelOrder: catchCancelOrder,
    catchPlaceOrder: catchPlaceOrder
};
