'use strict';

class VarNum {
    static readVarInt(byteArray) {
        return this.readVarNum(byteArray, 5);
    }

    static readVarLong(byteArray) {
        return this.readVarNum(byteArray, 10);
    }

    static readVarNum(byteArray, maxBytes) {
        let readAnotherByte = (byteArray[0] & 128) >> 7;
        let resultInt = readAnotherByte == 0 ? byteArray[0] & 127 : '';
        let currentByte = 0;
        let i = 0;

        let stack = [];

        while(readAnotherByte) {
            currentByte = (byteArray[i] & 127).toString(2);
            currentByte = '0'.repeat(7-currentByte.length) + currentByte;
            stack.push(currentByte);

            readAnotherByte = (byteArray[i] & 128) >> 7;

            if(maxBytes && i > maxBytes) {
                throw RangeException(`VarNum exceeded max range of ${maxBytes} bytes`);
            }

            i++;
        }

        while(stack.length > 0) {
            resultInt += stack.pop();
        }

        return parseInt(resultInt, 2);
    }
}

module.exports = VarNum;