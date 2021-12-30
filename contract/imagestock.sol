// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}


contract CeloComm {

    using SafeMath for uint;
    uint internal communityCount = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    address public adminAddress;

    struct Community {
        address payable admin;
        string name;
        string image;
        string description;
        uint supporters;
        uint raised;
    }

    mapping (uint => Community) internal communities;

    constructor(){
        adminAddress = msg.sender;
    }

    // admin modifier
    modifier onlyAdmin(uint _index) {
        require(communities[_index].admin == msg.sender || adminAddress == msg.sender, 'only admin can modify parameters');
        _;
    }

    // owner of contract modifier
    modifier onlyOwner() {
        require(adminAddress == msg.sender, 'only admin can modify parameters');
        _;
    }

    // create a community
    function addCommunity(
        string memory _name,
        string memory _image,
        string memory _description
    ) public {
        communities[communityCount] = Community(
            payable(msg.sender),
            _name,
            _image,
            _description,
            0,
            0
        );
        communityCount++;
    }

    // get a certain community
    function fetchCommunity(uint _index) public view returns (
        address payable,
        string memory,
        string memory,
        string memory,
        uint,
        uint
    ) {
        return (
        communities[_index].admin,
        communities[_index].name,
        communities[_index].image,
        communities[_index].description,
        communities[_index].raised,
        communities[_index].supporters
        );
    }

    // support community
    function supportCommunity(uint _index, uint _amount) public payable  {
        address _admin = communities[_index].admin;
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender, _admin, _amount), "Transfer failed."
        );

        communities[_index].supporters.add(1);
        communities[_index].raised.add(_amount);
    }

    // get number of communities
    function getCommunityCount() public view returns (uint) {
        return (communityCount);
    }

    // edit community parameters
    function editCommunity(
        uint _index,
        string memory _name,
        string memory _image,
        string memory _description
    ) onlyAdmin(_index) public {
        communities[_index].name = _name;
        communities[_index].image = _image;
        communities[_index].description = _description;
    }

    // transfer ownership to another admin
    function makeAdmin(uint _index, address _newAdmin) onlyAdmin(_index) public {
        require(_newAdmin != address(0), "new owner cannot be the zero address");

        communities[_index].admin = payable(_newAdmin);

    }


    //transfer ownership of contract
    function revokeOwnership( address _address) onlyOwner public {
        adminAddress  = _address;
    }
}
