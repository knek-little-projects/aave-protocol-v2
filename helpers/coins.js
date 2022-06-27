const { ethers } = require("hardhat");

const metadata = {
  AAVE: {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  },
  BAT: {
    address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  },
  BUSD: {
    address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
  },
  DAI: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    balanceSlot: 2,
  },
  ENJ: {
    address: '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c',
  },
  KNC: {
    address: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200',
  },
  LINK: {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  },
  MANA: {
    address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
  },
  MKR: {
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  },
  REN: {
    address: '0x408e41876cCCDC0F92210600ef50372656052a38',
  },
  SNX: {
    address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
  },
  SUSD: {
    address: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
  },
  TUSD: {
    address: '0x0000000000085d4780B73119b644AE5ecd22b376',
  },
  UNI: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    balanceSlot: 9,
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  WBTC: {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    balanceSlot: 3,
  },
  YFI: {
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
  },
  ZRX: {
    address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
  },
  xSUSHI: {
    address: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
  },
}


async function setERC20Balance(signerAddress, contractAddress, slot, value) {
  if (signerAddress === undefined) throw Error(`setERC20Balance: specify whose balance to change!`)
  if (contractAddress === undefined) throw Error(`setERC20Balance: specify ERC20 address!`)
  if (slot === undefined) throw Error(`setERC20Balance: specify slot!`)

  const toBytes32 = (bn) => {
    return ethers.utils.hexlify(ethers.utils.zeroPad(bn.toHexString(), 32));
  }

  const setStorageAt = async (address, index, value) => {
    await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
    await ethers.provider.send("evm_mine", []); // Just mines to the next block
  }

  const index = ethers.utils.solidityKeccak256(
    ["uint256", "uint256"],
    [signerAddress, slot] // key, slot
  )

  await setStorageAt(
    contractAddress,
    index.toString(),
    toBytes32(value).toString()
  );
}

module.exports = class ERC20Helper {
  static metadata = metadata

  static get(symbol) {
    if (symbol in metadata) {
      return new this(metadata[symbol])
    } 
    throw Error()
  }

  constructor({ address, balanceSlot }) {
    this.address = address
    this.balanceSlot = balanceSlot
  }

  async setBalance(userAddress, value) {
    return await setERC20Balance(userAddress, this.address, this.balanceSlot, value)
  }
}
