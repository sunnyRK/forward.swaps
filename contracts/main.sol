pragma solidity ^0.6.12;

import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IERC20.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Router02.sol';
import './helper/SafeERC20.sol';
import './helper/SafeMath.sol';
import './helper/Ownable.sol';
import "./IRelayRecipient.sol";

/**
 * A base contract to be inherited by any contract that want to receive relayed transactions
 * A subclass must use "_msgSender()" instead of "msg.sender"
 */
abstract contract BaseRelayRecipient is IRelayRecipient {

    /*
     * Forwarder singleton we accept calls from
     */
    address public trustedForwarder;

    /*
     * require a function to be called through GSN only
     */
    modifier trustedForwarderOnly() {
        require(msg.sender == address(trustedForwarder), "Function can only be called through the trusted Forwarder");
        _;
    }

    function isTrustedForwarder(address forwarder) public override view returns(bool) {
        return forwarder == trustedForwarder;
    }

    /**
     * return the sender of this call.
     * if the call came through our trusted forwarder, return the original sender.
     * otherwise, return `msg.sender`.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender() internal override virtual view returns (address payable ret) {
        if (msg.data.length >= 24 && isTrustedForwarder(msg.sender)) {
            // At this point we know that the sender is a trusted forwarder,
            // so we trust that the last bytes of msg.data are the verified sender address.
            // extract sender address from the end of msg.data
            assembly {
                ret := shr(96,calldataload(sub(calldatasize(),20)))
            }
        } else {
            return msg.sender;
        }
    }
}

contract BiconomySwapper is BaseRelayRecipient, Ownable {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    IUniswapV2Router02 public iUniswapV2Router02;
    
    //_trustedForwarder Kovan : 0xE8Df44bcaedD41586cE73eB85e409bcaa834497B
    constructor(address _trustedForwarder) public {
        trustedForwarder = _trustedForwarder;
        iUniswapV2Router02 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    }
     
    function swapWithoutETH(address _reciever, address _erc20, address[] memory _path, uint256 _amount) public returns(uint256[] memory) {
        require(_amount > 0 
                && _reciever != address(0) 
                &&_erc20 != address(0) 
                && _path[0] != address(0) 
                && _path[1] != address(0), 
            "Input is not correct!!!");
        IERC20(_erc20).safeApprove(address(iUniswapV2Router02), 0);
        IERC20(_erc20).safeApprove(address(iUniswapV2Router02), _amount);
        IERC20(_erc20).safeTransferFrom(_msgSender(), address(this), _amount);  // msg.sender => _msgSender() 
        uint256[] memory amounts = iUniswapV2Router02.swapExactTokensForTokens(
            _amount, // Input amount(e.g. 100 DAI want to exchange)
            0,
            _path, 
            _reciever, // msg.sender => _msgSender()  // after swap the output erc20 token will sent to user(msg.sender)
            block.timestamp.add(3600)
        );
        return amounts;
    }
    
    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        trustedForwarder = _trustedForwarder;
    }
    
}