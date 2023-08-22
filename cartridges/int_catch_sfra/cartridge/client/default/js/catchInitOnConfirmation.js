'use strict';

var catchHelper = require('./catch/helper/catchHelper');

catchHelper.initializeCatchSDK('checkout');

if ($('.hero.slant-down.hero-confirmation').length > 0) {
    catchHelper.hideWidget($('catch-callout'));
}
