var Decimal = function (value) {
    this.value = value;
};

Decimal.prototype.get = function () {
    return this.value;
};
Decimal.prototype.toString = function () {
    return this.value ? this.value.toString() : '';
};
Decimal.prototype.multiply = function (factor) {
    return new Decimal(this.value * factor);
};
module.exports = Decimal;
