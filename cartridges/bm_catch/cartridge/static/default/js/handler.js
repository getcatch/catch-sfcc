'use strict';

/* globals jQuery */
(function ($) {
    $(document).ready(function () {
        var $catchConfEnabled = $('#isConfEnabled');
        var $configSelector = $('#configSelector');

        $catchConfEnabled.on('click', function () {
            var isChecked = $(this).is(':checked');
            $configSelector.prop('disabled', !isChecked);
        });

        $configSelector.on('change', function () {
            var valueSelected = this.value;

            $.ajax({
                dataType: 'html',
                url: $(this).data('get-pref-url'),
                data: {
                    valueSelected: valueSelected
                },
                xhrFields: {
                    withCredentials: true
                }
            })
            .done(function (response) {
                // success
                $('.set-of-data').empty().html(response);
                $('#error-bar').addClass('d-none');
            })
            .fail(function (xhr, textStatus) {
                console.log('Fail responce');
                $('#error-bar').empty().text(textStatus);
                $('#error-bar').removeClass('d-none');
            });
        });
    });
}(jQuery));
