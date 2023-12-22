
const { goToBid, updateBid, getBidDetail, searchProduct, goToProductPage } = require("./index");
const { getUserData, setUserData } = require("./utils/storeUtil");

async function ipcHandle(e, args) {
    if (!args || !args.event) {
        return;
    }
    const event = args.event;
    const params = args.params;
    let data;
    if (event == "startBid") {
        goToBid(params);
    } else if (event == "fetchBidDetail") {
        data = await getBidDetail(params);
    } else if (event == "startUpdateBid") {
        data = await updateBid(params);
    } else if (event == "fetchProduct") {
        data = await searchProduct(params);
    } else if (event == "handleGoToProductPage") {
        data = await goToProductPage(params);
    } else if (event == "handleGoToProductPage") {
        data = await goToProductPage(params);
    } else if (event == "getUserData") {
        data = getUserData(params);
    } else if (event == "setUserData") {
        setUserData(params);
    }


    return data;
}

module.exports = { ipcHandle };
