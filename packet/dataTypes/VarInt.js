'use strict';

class VarInt {
    static readVarInt(byteArray) {
        let readAnotherByte = 1;
        let resultInt = 0;
        let currentByte = 0;
        let i = 0;

        while(readAnotherByte) {
            currentByte = parseInt(byteArray[i], 2);
            resultInt = resultInt | ((currentByte & 127) << (7 * i));
            readAnotherByte = currentByte & 128;
            i += 1;
        }

        return resultInt;
    }
}