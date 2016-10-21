
class BasePacket {
    constructor(byteArray) {
        this.binaryValue = this.getBinaryFromByteArray(byteArray);
        this.length = 0;
    }

    static getBinaryFromByteArray(byteArray) {
        let binaryValue = ''
        for (let byte of byteArray) {
            binaryValue += byte
        }
        return parseInt(binaryValue, 2);
    }
}

module.exports = BasePacket
