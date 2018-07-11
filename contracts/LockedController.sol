pragma solidity ^0.4.23;

import "Controller.sol";

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
  * @dev Gets the total balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public view returns (uint256) {
    uint256 totalBalance=0;
    for(uint256 i=0; i<lockedBalances[_owner].length; i++){
        totalBalance+=lockedBalances[_owner][i].balance;
    }
    totalBalance.add(balances[_owner]);
    return totalBalance;
  }

  /**
  * @dev Gets the unlocked balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function unlockedBalanceOf(address _owner) public view returns (uint256) {
    uint256 totalBalance=0;
    for(uint256 i=0; i<lockedBalances[_owner].length; i++){
        if(lockedBalances[_owner][i].timestamp<now)
          totalBalance.add(lockedBalances[_owner][i].balance);
    }
    totalBalance.add(balances[_owner]);
    return totalBalance;
  }

  /**
  * @dev Groups the unlocked balance to the first position of the array for the specified address.
  * @param _owner The address to consolidate the balance of.
  */
  function consolidateBalance(address _owner) public returns (bool) {
      tlBalance[] storage auxBalances = lockedBalances[_owner];
      delete lockedBalances[_owner];
      for(uint256 i=0; i<auxBalances.length; i++){
          if(auxBalances[i].timestamp<now){
            balances[_owner].add(auxBalances[i].balance);
          }
          else {
              lockedBalances[_owner].push(auxBalances[i]);
          }
          delete auxBalances[i];
      }
      return true;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= unlockedBalanceOf(msg.sender));
    consolidateBalance(msg.sender);
    return super.transfer(_to, _value);
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= unlockedBalanceOf(_from));
    require(_value <= allowed[_from][msg.sender]);
    consolidateBalance(_from);
    return super.transferFrom(_from, _to, _value);
  }

  /**
  * @dev Unlocks balance of the specified address, only callable by owner
  * @param _owner The address to query the the balance of.
  */
  function unlockAllFunds(address _owner) onlyOwner public returns (bool){
      uint256 totalBalance = balanceOf(_owner);
      delete lockedBalances[_owner];
      balances[msg.sender]=totalBalance;
      return true;
  }

  /**
   * @dev Function to mint locked tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @param _timestamp When the tokens will be unlocked
   * @return A boolean that indicates if the operation was successful.
   */
  function addLockedBalance(address _to, uint256 _amount, uint256 _timestamp) onlyOwner canMint public returns (bool) {
      require(cap > 0);
      require(totalSupply_.add(_amount) <= cap);
      totalSupply_ = totalSupply_.add(_amount);
      lockedBalances[_to].push(tlBalance(_timestamp,_amount));
      emit Mint(_to, _amount);
      emit Locked(_to, _amount, _timestamp);
      return true;
  }
}
