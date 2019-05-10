pragma solidity ^0.4.24;

import "./Controller.sol";

contract LockedController is Controller {

  /**
  * Defining locked balance data structure
  **/
  struct tlBalance {
    uint256 timestamp;
    uint256 balance;
  }

  mapping(address => tlBalance[]) lockedBalances;

  event Locked(address indexed to, uint256 amount, uint256 timestamp);

  /**
  * @dev Returns the amount of locked balances of the specified address.
  * @param _owner The address to query the balance of.
  * @return An uint256 representing the length of the array of locked balances owned by the passed address.
  */
  function lockedBalanceLength(address _owner) public view returns (uint256) {
    return lockedBalances[_owner].length;
  }

  /**
  * @dev Returns the locked balance of the specified address.
  * @param _owner The address to query the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function lockedBalanceOf(address _owner) public view returns (uint256) {
    uint256 lockedBalance=0;
    for(uint256 i=0; i<lockedBalanceLength(_owner); i++){
      if(lockedBalances[_owner][i].timestamp>now) {
        lockedBalance+=lockedBalances[_owner][i].balance;
      }
    }
    return lockedBalance;
  }

  /**
  * @dev Returns the unlocked balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function unlockedBalanceOf(address _owner) public view returns (uint256) {
    return super.balanceOf(_owner)-lockedBalanceOf(_owner);
  }

  /**
  * @dev Removes the already unlocked tokens from the lockedBalances array for the specified address.
  * @param _owner The address to consolidate the balance of.
  */
  function consolidateBalance(address _owner) public returns (bool) {
    tlBalance[] storage auxBalances = lockedBalances[_owner];
    delete lockedBalances[_owner];
    for(uint256 i=0; i<auxBalances.length; i++){
      if(auxBalances[i].timestamp>now) {
        lockedBalances[_owner].push(auxBalances[i]);
      }
    }
    return true;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _amount The amount to be transferred.
  */
  function transfer(address _to, uint256 _amount) public returns (bool) {
    require(_to != address(0), "You can not transfer to address(0).");
    require(_amount <= unlockedBalanceOf(msg.sender), "There is not enough unlocked balance.");
    consolidateBalance(msg.sender);
    return super.transfer(_to, _amount);
  }

  /**
  * @dev Transfer tokens from one address to another
  * @param _from address The address which you want to send tokens from
  * @param _to address The address which you want to transfer to
  * @param _amount uint256 the amount of tokens to be transferred
  */
  function transferFrom(address _from, address _to, uint256 _amount) public returns (bool) {
    require(_to != address(0), "You can not transfer to address(0).");
    require(_amount <= unlockedBalanceOf(_from), "There is not enough unlocked balance.");
    require(_amount <= allowed[_from][msg.sender], "There is not enough allowance.");
    consolidateBalance(_from);
    return super.transferFrom(_from, _to, _amount);
  }

  /**
  * @dev Unlocks balance of the specified address, only callable by owner
  * @param _owner The address to query the the balance of.
  */
  function unlockAllFunds(address _owner) onlyOwner public returns (bool){
    delete lockedBalances[_owner];
    return true;
  }

  /**
  * @dev transfer token to a specified address
  * @param _to The address to transfer to.
  * @param _amount The amount to be transferred.
  * @param _timestamp Unlock timestamp.
  */
  function transferLockedFunds(address _to, uint256 _amount, uint256 _timestamp) public returns (bool){
    transfer(_to, _amount);
    lockedBalances[_to].push(tlBalance(_timestamp,_amount));
    emit Locked(_to, _amount, _timestamp);
    return true;
  }

  /**
  * @dev Transfer tokens from one address to another
  * @param _from address The address which you want to send tokens from
  * @param _to address The address which you want to transfer to
  * @param _amount uint256 the amount of tokens to be transferred
  * @param _timestamp Unlock timestamp.
  */
  function transferLockedFundsFrom(address _from, address _to, uint256 _amount, uint256 _timestamp) public returns (bool) {
    transferFrom(_from, _to, _amount);
    lockedBalances[_to].push(tlBalance(_timestamp,_amount));
    emit Locked(_to, _amount, _timestamp);
    return true;
  }

  /**
  * @dev transfer token to a specified address
  * @param _to The address to transfer to.
  * @param _amounts The amounts to be transferred.
  * @param _timestamps Unlock timestamps.
  */
  function transferListOfLockedFunds(address _to, uint256[] _amounts, uint256[] _timestamps) public returns (bool) {
    require(_amounts.length==_timestamps.length, "There is not the same number of amounts and timestamps.");
    uint256 _amount = 0;
    for(uint256 i=0; i<_amounts.length; i++){
      _amount += _amounts[i];
    }
    transfer(_to, _amount);
    for(i=0; i<_amounts.length; i++){
      lockedBalances[_to].push(tlBalance(_timestamps[i],_amounts[i]));
      emit Locked(_to, _amounts[i], _timestamps[i]);
    }
    return true;
  }

  /**
  * @dev Transfer tokens from one address to another
  * @param _from address The address which you want to send tokens from
  * @param _to address The address which you want to transfer to
  * @param _amounts uint256 the amount of tokens to be transferred
  * @param _timestamps Unlock timestamps.
  */
  function transferListOfLockedFundsFrom(address _from, address _to, uint256[] _amounts, uint256[] _timestamps) public returns (bool) {
    require(_amounts.length==_timestamps.length, "There is not the same number of amounts and timestamps.");
    uint256 _amount = 0;
    for(uint256 i=0; i<_amounts.length; i++){
      _amount += _amounts[i];
    }
    transferFrom(_from, _to, _amount);
    for(i=0; i<_amounts.length; i++){
      lockedBalances[_to].push(tlBalance(_timestamps[i],_amounts[i]));
      emit Locked(_to, _amounts[i], _timestamps[i]);
    }
    return true;
  }

  /**
  * @dev Function to mint locked tokens
  * @param _to The address that will receive the minted tokens.
  * @param _amount The amount of tokens to mint.
  * @param _timestamp When the tokens will be unlocked
  * @return A boolean that indicates if the operation was successful.
  */
  function mintLockedBalance(address _to, uint256 _amount, uint256 _timestamp) onlyOwner canMint public returns (bool) {
    require(_timestamp>now, "You can not add a token to unlock in the past.");
    super.mint(_to, _amount);
    lockedBalances[_to].push(tlBalance(_timestamp,_amount));
    emit Locked(_to, _amount, _timestamp);
    return true;
  }
}
