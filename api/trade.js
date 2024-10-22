module.exports = async (req, res) => {
    var response = {"status":"ok","msg":"","data":{"symbol":"XAUUSD","trade":"BUY","priceStart":2730.5,"priceEnd":2728.3,"SL":2720}};
    return res.status(200).json(response);
}
