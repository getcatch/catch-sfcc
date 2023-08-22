$('#catch-payment-button').on('click', function () {
    var userPhone = $('#catch-payment-button').data('phone');
    var userName = $('#catch-payment-button').data('name');
    var userEmail = $('#catch-payment-button').data('email');

    $.ajax({
        url: $('#catch-payment-button').data('catch-create-order-url'),
        method: 'GET'
    })
        .done(function (data) {
            if (data.error) {
                var $catchError = $('#catch-error');
                $catchError.addClass('error-form');
                $catchError.text(data.errorMessage);
            } else {
                var catchCheckoutID = data.catch_checkoutId;
                var options = {
                    inline: true,
                    autoCloseOnConfirm: data.autoCloseOnConfirm,
                    hideHeader: data.hideHeader,
                    oprefill: {
                        userPhone: userPhone,
                        userName: userName,
                        userEmail: userEmail
                    },
                    onCancel: function () {
                        var redirect = $('<form>').appendTo(document.body).attr({
                            method: 'POST',
                            action: data.cancelURL
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'orderNo',
                            value: data.orderNo
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'orderToken',
                            value: data.orderToken
                        });

                        redirect.submit();
                    }
                };

                if (data.isCatchVirtualCard) {
                    options.onConfirm = function (cardDetails) {
                        var redirect = $('<form>').appendTo(document.body).attr({
                            method: 'POST',
                            action: data.continueURL
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'orderNo',
                            value: data.orderNo
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'orderToken',
                            value: data.orderToken
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'cardNumber',
                            value: cardDetails.card_number
                        });
                        $('<input>').appendTo(redirect).attr({
                            name: 'expirationMonth',
                            value: cardDetails.expiration_month
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'expirationYear',
                            value: cardDetails.expiration_year
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'cvc',
                            value: cardDetails.cvc
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'zipCode',
                            value: cardDetails.zip_code
                        });

                        redirect.submit();
                    };
                    catchPromise.openVirtualCardCheckout(catchCheckoutID, options);
                } else {
                    options.onConfirm = function () {
                        var redirect = $('<form>').appendTo(document.body).attr({
                            method: 'POST',
                            action: data.continueURL
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'orderNo',
                            value: data.orderNo
                        });

                        $('<input>').appendTo(redirect).attr({
                            name: 'orderToken',
                            value: data.orderToken
                        });

                        redirect.submit();
                    };
                    catchPromise.openCheckout(catchCheckoutID, options);
                }
            }
        });
});
