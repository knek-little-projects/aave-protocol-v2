import { task } from 'hardhat/config';
import { parseEther } from 'ethers/lib/utils';
import { getFirstSigner, getLendingPool, getLendingPoolAddressesProvider, getLendingPoolConfiguratorProxy, getMintableERC20 } from '../../helpers/contracts-getters';
import { getEthersSigners } from '../../helpers/contracts-helpers';
import { RateMode } from '../../helpers/types';
import { MyMockFlashLoanReceiverFactory } from '../../types';

task('onboarding-simulation', 'Simulate some scenarios')
  .setAction(async ({ }, localBRE) => {

    await localBRE.run('set-DRE');
    await localBRE.run('aave:mainnet');

    const addressProvider = await getLendingPoolAddressesProvider()
    const poolAdminAddress = await addressProvider.getPoolAdmin()
    const accountHelper = require("../../helpers/accounts")
    const poolAdmin = await accountHelper.impersonate(poolAdminAddress)
    const eadminAddress = await addressProvider.getEmergencyAdmin()
    const eadmin = await accountHelper.impersonate(eadminAddress)

    const pool = await getLendingPool()
    console.log("pool address", pool.address)

    const signers = await (await getEthersSigners())
    const users = [signers[0], signers[1]]

    const coinHelper = require("../../helpers/coins");
    const coinList = ["USDC", "WETH"]
    const coins: any = {}

    for (const u of users) {
      for (const c of coinList) {
        const h = await coinHelper.get(c)
        await h.setBalance(await u.getAddress(), parseEther("1111111111.0"))
        coins[c] = await getMintableERC20(h.address)
        await coins[c].connect(u).approve(pool.address, parseEther('111111111111.0'));
      }
    }

    console.log("Unpausing the pool")
    const conf = await getLendingPoolConfiguratorProxy()
    await conf.connect(eadmin).setPoolPause(false)
    
    console.log("user1: depositing in the pool")
    await pool.connect(users[0]).deposit(coins.USDC.address, parseEther('111111111.0'), await users[0].getAddress(), 0);
    await pool.connect(users[0]).setUserUseReserveAsCollateral(coins.USDC.address, false)
    await pool.connect(users[0]).deposit(coins.WETH.address, parseEther('111111111.0'), await users[0].getAddress(), 0);
    await pool.connect(users[0]).setUserUseReserveAsCollateral(coins.WETH.address, false)

    console.log("user2: depositing in the pool")
    await pool.connect(users[1]).deposit(coins.WETH.address, parseEther("1.0"), await users[1].getAddress(), 0)
    await pool.connect(users[1]).setUserUseReserveAsCollateral(coins.WETH.address, true)

    console.log("user2: borrowing")
    await pool.connect(users[1]).borrow(coins.USDC.address, 100, RateMode.Stable, 0, await users[1].getAddress())

    console.log("=== flashloan ===")

    const _mockFlashLoanReceiver = await new MyMockFlashLoanReceiverFactory(await getFirstSigner()).deploy(addressProvider.address)

    const flashloanAmount = 500;

    await pool.connect(users[1]).flashLoan(
      _mockFlashLoanReceiver.address,
      [coins.USDC.address],
      [flashloanAmount],
      [0],
      await users[1].getAddress(),
      '0x10',
      '0'
    );

    console.log("DONE")
  });
