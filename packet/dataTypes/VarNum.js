'use strict';

class VarNum {
    static readVarInt(byteArray) {
        return this.readVarNum(byteArray, 5);
    }

    static readVarLong(byteArray) {
        return this.readVarNum(byteArray, 10);
    }

    static readVarNum(byteArray, maxBytes) {
        let readAnotherByte = 1;
        let resultInt = 0;
        let currentByte = 0;
        let i = 0;

        while(readAnotherByte) {
            currentByte = parseInt(byteArray[i], 2);
            resultInt = resultInt | ((currentByte & 127) << (7 * i));
            readAnotherByte = currentByte & 128;
            i += 1;

            byteArray = byteArray.slice(1);

            if(maxBytes && i > maxBytes) {
                throw RangeException(`VarNum exceeded max range of ${maxBytes} bytes`);
            }
        }

        return resultInt;
    }
}

module.exports = VarNum;