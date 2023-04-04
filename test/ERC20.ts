import {
  time,
  loadFixture
} from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ERC20 } from '../typechain-types';

describe('ERC20', () => {
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const amount = 100;

  const deployERC20 = async () => {
    const [owner, otherAccount] = await ethers.getSigners();

    const name = 'erc20TokenName';
    const symbol = 'erc20TokenSymbol';

    const ERC20 = await ethers.getContractFactory('ERC20');
    const erc20 = await ERC20.deploy(name, symbol);

    return { erc20, owner, otherAccount, name, symbol };
  };

  const getBalances = (
    erc20: ERC20,
    ...signers: SignerWithAddress[]
  ) =>
    Promise.all(
      signers.map(signer => erc20.balanceOf(signer.address))
    );

  describe('Deployment', () => {
    it('Should set the right name', async () => {
      const { erc20, name } = await loadFixture(deployERC20);

      expect(await erc20.name()).to.equal(name);
    });

    it('Should set the right symbol', async () => {
      const { erc20, symbol } = await loadFixture(deployERC20);

      expect(await erc20.symbol()).to.equal(symbol);
    });
  });

  describe('Transfers', () => {
    it('Should revert if trying to transfer to zero address', async () => {
      const { erc20 } = await loadFixture(deployERC20);

      const result = erc20.transfer(zeroAddress, 100);

      await expect(result).to.be.revertedWith(
        'ERC20: transfer to the zero address'
      );
    });

    it('Should transfer tokens from one address to another', async () => {
      const { erc20, owner, otherAccount } = await loadFixture(
        deployERC20
      );

      const [initialOtherAccountBalance, initialOwnerBalance] =
        await getBalances(erc20, otherAccount, owner);

      await erc20.transfer(otherAccount.address, amount);

      const [otherAccountBalance, ownerBalance] = await getBalances(
        erc20,
        otherAccount,
        owner
      );

      expect(otherAccountBalance).to.equal(
        initialOtherAccountBalance.add(amount)
      );
      expect(ownerBalance).to.equal(initialOwnerBalance.sub(amount));
    });

    it('Should update balances correctly after multiple transfers', async () => {
      const { erc20, owner, otherAccount } = await loadFixture(
        deployERC20
      );

      const [initialOtherAccountBalance, initialOwnerBalance] =
        await getBalances(erc20, otherAccount, owner);

      const amountOne = 50;
      const amountTwo = 25;
      const sum = amountOne + amountTwo;

      await erc20.transfer(otherAccount.address, amountOne);
      await erc20.transfer(otherAccount.address, amountTwo);

      const [otherAccountBalance, ownerBalance] = await getBalances(
        erc20,
        otherAccount,
        owner
      );

      expect(otherAccountBalance).to.equal(
        initialOtherAccountBalance.add(sum)
      );
      expect(ownerBalance).to.equal(initialOwnerBalance.sub(sum));
    });

    it('Should revert if transfer amount exceeds balance', async () => {
      const { erc20, owner, otherAccount } = await loadFixture(
        deployERC20
      );

      const [initialOtherAccountBalance, initialOwnerBalance] =
        await getBalances(erc20, otherAccount, owner);

      const result = erc20.transfer(
        otherAccount.address,
        initialOwnerBalance.add(100)
      );
      await expect(result).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance'
      );

      const [otherAccountBalance, ownerBalance] = await getBalances(
        erc20,
        otherAccount,
        owner
      );

      expect(otherAccountBalance).to.equal(
        initialOtherAccountBalance
      );
      expect(ownerBalance).to.equal(initialOwnerBalance);
    });
  });

  describe('Approve', () => {
    it('Should revert if trying approve zero address', async () => {
      const { erc20 } = await loadFixture(deployERC20);

      const result = erc20.approve(zeroAddress, 100);

      await expect(result).to.be.revertedWith(
        'ERC20: approve to the zero address'
      );
    });

    it('Should emit "Approval" event', async () => {
      const { erc20, owner, otherAccount } = await loadFixture(
        deployERC20
      );

      const result = await erc20.approve(
        otherAccount.address,
        amount
      );

      expect(result)
        .to.emit(erc20, 'Approval')
        .withArgs(owner.address, otherAccount.address, amount);
    });

    it('Should update allowance if approve address', async () => {
      const { erc20, owner, otherAccount } = await loadFixture(
        deployERC20
      );

      await erc20.approve(otherAccount.address, amount);

      const result = await erc20.allowance(
        owner.address,
        otherAccount.address
      );

      expect(result).to.be.equal(amount);
    });
  });

  describe('TransfersFrom', () => {
    it('Should revert if no allowance', async () => {
      const { erc20, otherAccount } = await loadFixture(deployERC20);

      const result = erc20.transferFrom(
        zeroAddress,
        otherAccount.address,
        100
      );

      await expect(result).to.be.revertedWith(
        'ERC20: insufficient allowance'
      );
    });

    it('Should revert if trying to transfer from zero address', async () => {
      const { erc20, owner } = await loadFixture(deployERC20);

      await erc20.approve(owner.address, 100);

      const result = erc20.transferFrom(
        owner.address,
        zeroAddress,
        100
      );

      await expect(result).to.be.revertedWith(
        'ERC20: transfer to the zero address'
      );
    });

    it('Should transfer tokens from one address to another', async () => {
      const { erc20, owner, otherAccount } = await loadFixture(
        deployERC20
      );

      await erc20.approve(owner.address, 100);

      const [initialOtherAccountBalance, initialOwnerBalance] =
        await getBalances(erc20, otherAccount, owner);

      await erc20.transferFrom(
        owner.address,
        otherAccount.address,
        100
      );

      const [otherAccountBalance, ownerBalance] = await getBalances(
        erc20,
        otherAccount,
        owner
      );

      expect(otherAccountBalance).to.equal(
        initialOtherAccountBalance.add(amount)
      );
      expect(ownerBalance).to.equal(initialOwnerBalance.sub(amount));
    });
  });
});
