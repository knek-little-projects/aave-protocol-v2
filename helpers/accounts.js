const { network, ethers } = require("hardhat");


module.exports = {
    async impersonate(address) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [address],
        });
        return await ethers.provider.getSigner(address)
    }
}
