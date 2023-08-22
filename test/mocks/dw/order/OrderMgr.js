var Order = require('./Order');

var OrderMgr = function () {};

OrderMgr.prototype.getOrder = function (orderNo, orderToken) {
    return new Order(orderNo, orderToken);
};
OrderMgr.prototype.queryOrders = function () {};
OrderMgr.prototype.searchOrder = function () {};
OrderMgr.prototype.failOrder = function () {};
OrderMgr.prototype.cancelOrder = function () {};
OrderMgr.prototype.placeOrder = function () {};
OrderMgr.prototype.searchOrders = function () {};
OrderMgr.prototype.createOrder = function () {};
OrderMgr.prototype.undoFailOrder = function () {};
OrderMgr.prototype.processOrders = function () {};
OrderMgr.prototype.describeOrder = function () {};
OrderMgr.prototype.queryOrder = function () {};
OrderMgr.prototype.createShippingOrders = function () {};

OrderMgr.prototype.order = null;

module.exports = OrderMgr;
