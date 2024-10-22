module.exports = async (req, res) => {
    var response = {"status":"ok","msg":"","data":{"symbol":"XAUUSD","trade":"BUY","priceStart":2733.5,"priceEnd":2736.3,"SL":2730}};
        response = {"status":"ok","msg":"","data":{}};
    return res.status(200).json(response);
}
