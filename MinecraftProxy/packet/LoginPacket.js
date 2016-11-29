
class LoginPacket {
    constructor(byteArray) {
        this.packetLength = VarNum.readVarNum(byteArray);
        this.dataLengthOrId = VarNum.readVarNum(byteArray);
    }

    static getBinaryFromByteArray(byteArray) {
        let binaryValue = '';
        for (let byte of byteArray) {
            binaryValue += byte
        }
        return binaryValue;
    }
}