(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var options = {};
        var publicKey = document.querySelector('.catch-data').dataset.key;
        catchjs.init(publicKey, options).then(function (promise) {
            catchPromise = promise;
            if ($('#is-Catch').length > 0) {
                $('#is-Catch').parents('.form-row.label-inline').removeClass('label-hidden');
            }

            if ($('#catch-payment-button').length > 0) {
                $('#catch-payment-button').attr('disabled', false);
            }
            return catchPromise;
        }).catch(function () {
            return;
        });
    });
}());
