pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";


contract Controller is MintableToken, PausableToken {
    address public thisAddr; // matches delegation slot in proxy
    uint256 public cap;      // the max cap of this token

    string public constant name = "Timelocked ILM token"; // solium-disable-line uppercase
    string public constant symbol = "TILM"; // solium-disable-line uppercase
    uint8 public constant decimals = 18; // solium-disable-line uppercase

    constructor() public {}

    /**
    * @dev Function to initialize storage, only callable from proxy.
    * @param _controller The address where code is loaded from through delegatecall
    * @param _cap The cap that should be set for the token
    */
    function initialize(address _controller, uint256 _cap) public onlyOwner {
        require(cap == 0, "Cap is already set");
        require(_cap > 0, "Trying to set an invalid cap");
        require(thisAddr == _controller, "Not calling from proxy");
        cap = _cap;
        totalSupply_ = 0;
    }

    /**
    * @dev Function to mint tokens
    * @param _to The address that will receive the minted tokens.
    * @param _amount The amount of tokens to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _amount) public onlyOwner canMint returns (bool) {
        require(cap > 0, "Cap not set, not initialized");
        require(totalSupply_.add(_amount) <= cap, "Trying to mint over the cap");
        return super.mint(_to, _amount);
    }
}
