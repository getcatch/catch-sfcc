var Money = require('../value/Money');
var Collection = require('../util/Collection');

var Order = function (orderNo, orderToken) {
    this.productLineItems = Collection.createFromArray([
        {
            price         : new Money(300,'USD'),
            adjustedPrice : new Money(15,'USD'),
            productID     : 'Product ID',
            productName   : 'Product Name',
            adjustedTax   : new Money(2,'USD'),
            taxRate       : 2,
            basePrice     : new Money(315,'USD'),
            taxClassID    : 'TaxClassID',
            quantity      : {
                unit    : 'pounds', 
                value   : 5,
                getUnit : function() { return this.unit },
            },
            product: {
                upc    : '33383',
                getUPC : function() { return this.upc },
            },
            getPrice         : function() { return this.price },
            getAdjustedPrice : function() { return this.adjustedPrice },
            getProductID     : function() { return this.productID },
            getProductName   : function() { return this.productName },
            getQuantityValue : function() { return this.quantity.value },
            getAdjustedTax   : function() { return this.adjustedTax },
            getTaxRate       : function() { return this.taxRate },
            getQuantity      : function() { return this.quantity },
            getProduct       : function() { return this.product },
            getBasePrice     : function() { return this.basePrice },
            getTaxClassID    : function() { return this.taxClassID }
        }
    ]);

    this.defaultShipment = {
        shippingAddress: {
            companyName : 'Company Name',
            address1    : 'Customer address 1',
            address2    : 'Customer address 2',
            city        : 'City',
            firstName   : 'Customer name',
            lastName    : 'Customer surname',
            fullName    : 'Customer fullname',
            phone       : 'Customer phone',
            stateCode   : 'PE',
            postalCode  : '01235',
            countryCode : {
                displayValue : 'USA',
                value        : 'US',
                valueOf      : function(){ return this.value }
            }
        },
        getShippingAddress: function(){
            return this.shippingAddress
        }
    };

    this.billingAddress = {
        companyName : 'Company Name',
        address1    : 'Customer address 1',
        address2    : 'Customer address 2',
        city        : 'City',
        firstName   : 'Customer name',
        lastName    : 'Customer surname',
        fullName    : 'Customer fullname',
        phone       : 'Customer phone',
        stateCode   : 'PE',
        postalCode  : '01235',
        countryCode : {
            displayValue : 'USA',
            value        : 'US',
            valueOf      : function(){ return this.value }
        }
    };

    this.UUID = 'order_uuid';
    this.customerNo = 'Customer_001'
    this.adjustedMerchandizeTotalTax = new Money(20,'USD');
    this.totalTax = new Money(25,'USD');
    this.shippingTotalPrice = new Money(30,'USD');
    this.currencyCode = 'USD';
    this.totalGrossPrice = new Money(340,'USD');
    this.customerEmail = 'customer@email.com';
	this.orderNo = orderNo;
    this.orderToken = orderToken;
	this.custom = {
		catch_earned: '100'
	};
};

Order.prototype.getDefaultShipment = function(){ return this.defaultShipment };
Order.prototype.getUUID = function(){ return this.UUID };
Order.prototype.getCustomerNo = function(){ return this.customerNo };
Order.prototype.getAdjustedMerchandizeTotalTax = function(){ return this.adjustedMerchandizeTotalTax };
Order.prototype.getShippingTotalPrice = function(){ return this.shippingTotalPrice }; 
Order.prototype.getTotalTax = function(){ return this.totalTax }; 
Order.prototype.getProductLineItems = function(){ return this.productLineItems }; 
Order.prototype.getCurrencyCode = function(){ return this.currencyCode };
Order.prototype.getTotalGrossPrice = function(){ return this.totalGrossPrice };
Order.prototype.getBillingAddress = function(){ return this.billingAddress };
Order.prototype.getCustomerEmail = function(){ return this.customerEmail };


Order.prototype.getStatus = function () {};
Order.prototype.getOrderNo = function () {};
Order.prototype.getExportStatus = function () {};
Order.prototype.getCreatedBy = function () {};
Order.prototype.setStatus = function () {};
Order.prototype.setExportStatus = function () {};
Order.prototype.getConfirmationStatus = function () {};
Order.prototype.setConfirmationStatus = function () {};
Order.prototype.getShippingStatus = function () {};
Order.prototype.setShippingStatus = function () {};
Order.prototype.getPaymentStatus = function () {};
Order.prototype.setPaymentStatus = function () {};
Order.prototype.getPaymentTransaction = function () {};
Order.prototype.getOrderToken = function () { return this.orderToken };
Order.prototype.getInvoiceNo = function () {};
Order.prototype.isImported = function () {};
Order.prototype.setInvoiceNo = function () {};
Order.prototype.getSourceCode = function () {};
Order.prototype.getSourceCodeGroupID = function () {};
Order.prototype.getSourceCodeGroup = function () {};
Order.prototype.addNote = function () {};
Order.prototype.getNotes = function () {};
Order.prototype.trackOrderChange = function () {};
Order.prototype.getOriginalOrderNo = function () {};
Order.prototype.getOriginalOrder = function () {};
Order.prototype.getReplaceCode = function () {};
Order.prototype.setReplaceCode = function () {};
Order.prototype.getReplaceDescription = function () {};
Order.prototype.setReplaceDescription = function () {};
Order.prototype.getReplacementOrderNo = function () {};
Order.prototype.getReplacementOrder = function () {};
Order.prototype.getReplacedOrderNo = function () {};
Order.prototype.getReplacedOrder = function () {};
Order.prototype.getCurrentOrderNo = function () {};
Order.prototype.getCurrentOrder = function () {};
Order.prototype.getCancelCode = function () {};
Order.prototype.setCancelCode = function () {};
Order.prototype.getCancelDescription = function () {};
Order.prototype.setCancelDescription = function () {};
Order.prototype.getExternalOrderNo = function () {};
Order.prototype.setExternalOrderNo = function () {};
Order.prototype.getExternalOrderStatus = function () {};
Order.prototype.setExternalOrderStatus = function () {};
Order.prototype.getExternalOrderText = function () {};
Order.prototype.setExternalOrderText = function () {};
Order.prototype.getCustomerLocaleID = function () {};
Order.prototype.getCustomerOrderReference = function () {};
Order.prototype.setCustomerOrderReference = function () {};
Order.prototype.getAffiliatePartnerName = function () {};
Order.prototype.setAffiliatePartnerName = function () {};
Order.prototype.getAffiliatePartnerID = function () {};
Order.prototype.setAffiliatePartnerID = function () {};
Order.prototype.getExportAfter = function () {};
Order.prototype.setExportAfter = function () {};
Order.prototype.setCustomer = function () {};
Order.prototype.getRemoteHost = function () {};
Order.prototype.getDeliveryOrderHeads = function () {};
Order.prototype.getInvoices = function () {};
Order.prototype.getInvoice = function () {};
Order.prototype.getReturnCases = function () {};
Order.prototype.getReturn = function () {};
Order.prototype.getReturnCase = function () {};
Order.prototype.createReturnCase = function () {};
Order.prototype.getCapturedAmount = function () {};
Order.prototype.getRefundedAmount = function () {};
Order.prototype.getDeliveryItem = function () {};
Order.prototype.getDeliveryItems = function () {};
Order.prototype.getReturnCaseItem = function () {};
Order.prototype.status=null;
Order.prototype.orderNo = null;
Order.prototype.exportStatus=null;
Order.prototype.createdBy=null;
Order.prototype.confirmationStatus=null;
Order.prototype.shippingStatus=null;
Order.prototype.paymentStatus=null;
Order.prototype.paymentTransaction=null;
Order.prototype.orderToken=null;
Order.prototype.invoiceNo=null;
Order.prototype.sourceCode=null;
Order.prototype.sourceCodeGroupID=null;
Order.prototype.sourceCodeGroup=null;
Order.prototype.notes=null;
Order.prototype.originalOrderNo=null;
Order.prototype.originalOrder=null;
Order.prototype.replaceCode=null;
Order.prototype.replaceDescription=null;
Order.prototype.replacementOrderNo=null;
Order.prototype.replacementOrder=null;
Order.prototype.replacedOrderNo=null;
Order.prototype.replacedOrder=null;
Order.prototype.currentOrderNo=null;
Order.prototype.currentOrder=null;
Order.prototype.cancelCode=null;
Order.prototype.cancelDescription=null;
Order.prototype.externalOrderNo=null;
Order.prototype.externalOrderStatus=null;
Order.prototype.externalOrderText=null;
Order.prototype.customerLocaleID=null;
Order.prototype.customerOrderReference=null;
Order.prototype.affiliatePartnerName=null;
Order.prototype.affiliatePartnerID=null;
Order.prototype.exportAfter=null;
Order.prototype.remoteHost=null;
Order.prototype.deliveryOrderHeads=null;
Order.prototype.invoices=null;
Order.prototype.invoice=null;
Order.prototype.returnCases=null;
Order.prototype.return=null;
Order.prototype.returnCase=null;
Order.prototype.capturedAmount=null;
Order.prototype.refundedAmount=null;
Order.prototype.billingAddress=null;
Order.prototype.deliveryItem=null;
Order.prototype.deliveryItems=null;
Order.prototype.returnCaseItem=null;
Order.prototype.order_token = null;

module.exports = Order;
