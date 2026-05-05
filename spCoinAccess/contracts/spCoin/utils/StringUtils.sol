// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/*
contract dynamicStringArray {
   string [] private strings;
 
   function addString (string memory str) external {
     strings.push (str);
   }
 
   function getStrings () external view returns (string [] memory) {
     return strings;
   }
 }
*/

contract StringUtils {
// string public text;

   function concat(string memory a, string memory b) internal pure returns (string memory) {
      return string(abi.encodePacked(a, b, "", "", ""));
   }

   function concat(string memory a, string memory b, string memory c) internal pure returns (string memory) {
      return string(abi.encodePacked(a, b, c, "", ""));
   }

   function concat(string memory a, string memory b, string memory c, string memory d) internal pure returns (string memory) {
      return string(abi.encodePacked(a, b, c, d, ""));
   }

   function concat(string memory a, string memory b, string memory c, string memory d, string memory e) internal pure returns (string memory) {
      return string(abi.encodePacked(a, b, c, d, e));
   }

   function toString(address account) internal pure returns(string memory) {
      return toString(abi.encodePacked(account));
   }

   function toString(uint256 value) internal pure returns(string memory) {
      return toString(abi.encodePacked(value));
   }

    function toString(bytes32 value) internal pure returns(string memory) {
      return toString(abi.encodePacked(value));
    }

   function toString(bool value) internal pure returns(string memory) {
      string memory strValue  = (value == true ? "true" : "false");
      return strValue;
   }

   function toString(address[] storage arrValues) internal view returns(string memory) {
      string memory strArrValue  = "";
      for (uint i = 0; i < arrValues.length; i++) {
          if (i == 0) {
              strArrValue = concat(strArrValue, toString(arrValues[i]));
          }
          else {
              strArrValue = concat(strArrValue, ",", toString(arrValues[i]));
          }
         // console.log(arrValues[i]);
      }
      return strArrValue;
  }

  function toString(bytes memory data) internal pure returns(string memory) {
       bytes memory alphabet = "0123456789abcdef";

       bytes memory str = new bytes(2 + data.length * 2);
       str[0] = "0";
       str[1] = "x";
       for (uint i = 0; i < data.length; i++) {
           str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
           str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
       }
       return string(str);
   }

}
